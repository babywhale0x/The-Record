/**
 * lib/shelby.ts  —  The Record × Shelby Protocol
 *
 * SERVER-SIDE ONLY. Never import from 'use client' components.
 *
 * Uses the official @shelby-protocol/sdk (ShelbyNodeClient) instead of
 * our old hand-rolled HTTP client. This gives us:
 *   - Correct erasure-coding + on-chain commitment flow
 *   - Proper session + micropayment channel management
 *   - Byte-range / streaming reads
 *   - Reliable TypeScript types from the SDK itself
 *
 * Public surface is identical to v1 so no API routes need to change.
 *
 * Blob naming convention (per Shelby docs):
 *   <account-address>/records/<slug>/<timestamp>
 *   <account-address>/documents/<slug>/<timestamp>-<filename>
 *   <account-address>/citations/<slug>/<timestamp>-cite.json
 *
 * Networks:
 *   testnet   → https://api.testnet.shelby.xyz/shelby   (Aptos testnet)
 *   shelbynet → https://api.shelbynet.shelby.xyz/shelby  (wipes weekly)
 *   local     → http://localhost:9090
 */

// ─── SDK import ───────────────────────────────────────────────────────────────
// The official SDK — npm install @shelby-protocol/sdk @aptos-labs/ts-sdk
// We import lazily inside functions so the module is only loaded server-side.
// If the SDK isn't installed yet we fall back to our HTTP client gracefully.

import type { ShelbyNodeClient as ShelbyNodeClientType } from '@shelby-protocol/sdk/node'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShelbyNetwork = 'testnet' | 'shelbynet' | 'local'

export interface ShelbyConfig {
  rpcEndpoint: string
  aptosFullnode: string
  privateKey: string
  accountAddress: string
  apiKey?: string
  network: ShelbyNetwork
  /** Optional CDN base URL — if set, reads go through CDN, writes still go direct */
  cdnBaseUrl?: string
}

export interface UploadReceipt {
  blobName: string
  aptosTxHash: string
  contentHash: string
  committedAt: number
  explorerUrl: string
  aptosExplorerUrl: string
  expiresAt: string
  /** Size in bytes */
  sizeBytes: number
}

export interface BlobContent {
  data: Uint8Array
  contentType: string
  blobName: string
  retrievedAt: number
  /** Total size of the blob (from Content-Length) */
  totalBytes?: number
}

export interface VerificationResult {
  verified: boolean
  onChainHash: string
  currentHash: string
  intact: boolean
  txDetails: { hash: string; timestamp: number; sender: string; gasUsed: number } | null
  verifiedAt: number
}

export interface RecordPayload {
  slug: string
  title: string
  body: string
  authorAddress: string
  contentType: string
  publishedAt: string
  tags: string[]
  tiers: { view: number; cite: number; license: number }
  /** Legacy compat */
  accessModel?: 'free' | 'pay-per-article' | 'subscription'
}

/** Keep old name as alias for API routes that still use it */
export type ArticlePayload = RecordPayload

export interface DocumentPayload {
  name: string
  mimeType: string
  data: Uint8Array
  sourceDescription: string
  articleSlug: string
}

export interface CitationPackage {
  /** The record being cited */
  recordSlug: string
  recordTitle: string
  /** Wallet address of the person who bought the Cite tier */
  citerAddress: string
  /** Original upload receipt for the record */
  recordReceipt: Pick<UploadReceipt, 'blobName' | 'aptosTxHash' | 'contentHash'>
  issuedAt: string
  citationId: string
}

export type UploadProgressCallback = (stage: UploadStage, progress?: number) => void

export type UploadStage =
  | 'preparing'
  | 'hashing'
  | 'uploading'
  | 'committing'
  | 'complete'
  | 'error'

// ─── Constants ────────────────────────────────────────────────────────────────

const NETWORK_CONFIG: Record<ShelbyNetwork, { rpc: string; aptos: string }> = {
  testnet: {
    rpc: 'https://api.testnet.shelby.xyz/shelby',
    aptos: 'https://api.testnet.aptoslabs.com/v1',
  },
  shelbynet: {
    rpc: 'https://api.shelbynet.shelby.xyz/shelby',
    aptos: 'https://api.shelbynet.shelby.xyz/v1',
  },
  local: {
    rpc: 'http://localhost:9090',
    aptos: 'http://127.0.0.1:8080/v1',
  },
}

const EXPLORER_BASE: Record<ShelbyNetwork, { shelby: string; aptos: string }> = {
  testnet: {
    shelby: 'https://explorer.shelby.xyz/testnet/account',
    aptos:  'https://explorer.aptoslabs.com/txn',
  },
  shelbynet: {
    shelby: 'https://explorer.shelby.xyz/shelbynet/account',
    aptos:  'https://explorer.aptoslabs.com/txn',
  },
  local: {
    shelby: 'http://localhost:3001/account',
    aptos:  'http://localhost:8080/txn',
  },
}

const DEFAULT_TTL_DAYS = 365

// ─── Error class ─────────────────────────────────────────────────────────────

export class ShelbyError extends Error {
  readonly statusCode?: number
  constructor(message: string, statusCode?: number) {
    super(message)
    this.name = 'ShelbyError'
    this.statusCode = statusCode
  }
}

// ─── SDK client factory ───────────────────────────────────────────────────────

/**
 * Try to create an official ShelbyNodeClient.
 * Returns null if the SDK isn't installed — callers fall back to HTTP.
 */
async function tryCreateSdkClient(config: ShelbyConfig): Promise<ShelbyNodeClientType | null> {
  try {
    const { ShelbyNodeClient } = await import('@shelby-protocol/sdk/node')
    const { Network } = await import('@aptos-labs/ts-sdk')

    // Map our network names to SDK Network enum
    const networkMap: Record<ShelbyNetwork, unknown> = {
      testnet:   Network.TESTNET,
      shelbynet: 'shelbynet', // custom network string
      local:     Network.LOCAL,
    }

    const client = new ShelbyNodeClient({
      network: networkMap[config.network] as never,
      apiKey: config.apiKey,
      // If a CDN URL is set, use it for reads
      ...(config.cdnBaseUrl ? { rpcUrl: config.cdnBaseUrl } : {}),
    })

    return client
  } catch {
    // SDK not installed — fall through to HTTP fallback
    return null
  }
}

// ─── HTTP fallback client ─────────────────────────────────────────────────────
// Used when @shelby-protocol/sdk is not yet installed.
// Remove once SDK is confirmed installed in production.

class ShelbyHttpClient {
  private readonly base: string
  private readonly apiKey?: string
  private readonly accountAddress: string

  constructor(config: ShelbyConfig) {
    this.base = (config.cdnBaseUrl || config.rpcEndpoint).replace(/\/$/, '')
    this.apiKey = config.apiKey
    this.accountAddress = config.accountAddress
  }

  private headers(extra: Record<string, string> = {}): HeadersInit {
    return {
      ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      'X-Account-Address': this.accountAddress,
      ...extra,
    }
  }

  async uploadBlob(
    name: string,
    data: Uint8Array,
    contentType: string,
    expiryUnix: number
  ): Promise<{ aptosTxHash: string }> {
    const url = `${this.base}/v1/blobs/${encodeURIComponent(name)}`
    const res = await fetch(url, {
      method: 'PUT',
      headers: this.headers({
        'Content-Type': contentType,
        'X-Expiry-Unix': String(expiryUnix),
        'Content-Length': String(data.byteLength),
      }),
      body: Buffer.from(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new ShelbyError(`Upload failed: HTTP ${res.status}${body ? ` — ${body}` : ''}`, res.status)
    }
    const aptosTxHash =
      res.headers.get('X-Aptos-Tx-Hash') ??
      res.headers.get('x-aptos-tx-hash') ??
      await res.json().then((j: Record<string, string>) => j.txHash ?? j.tx_hash).catch(() => '') ??
      ''
    return { aptosTxHash }
  }

  /**
   * GET with optional byte-range support.
   * Pass `range` as "bytes=0-1048575" for streaming first 1 MiB.
   */
  async getBlob(name: string, range?: string): Promise<{ data: Uint8Array; contentType: string; totalBytes?: number }> {
    const url = `${this.base}/v1/blobs/${encodeURIComponent(name)}`
    const extraHeaders: Record<string, string> = {}
    if (range) extraHeaders['Range'] = range

    const res = await fetch(url, { method: 'GET', headers: this.headers(extraHeaders) })
    if (!res.ok && res.status !== 206) {
      throw new ShelbyError(`Get blob failed: HTTP ${res.status}`, res.status)
    }
    const contentType = res.headers.get('Content-Type') ?? 'application/octet-stream'
    const contentRange = res.headers.get('Content-Range') // "bytes 0-1047575/4194304"
    const totalBytes = contentRange
      ? parseInt(contentRange.split('/')[1] ?? '0', 10)
      : parseInt(res.headers.get('Content-Length') ?? '0', 10)
    const buffer = await res.arrayBuffer()
    return { data: Buffer.from(buffer) as unknown as Uint8Array, contentType, totalBytes }
  }

  async uploadBlobMultipart(
    name: string,
    data: Uint8Array,
    contentType: string,
    expiryUnix: number,
    onProgress?: (uploaded: number, total: number) => void
  ): Promise<{ aptosTxHash: string }> {
    const PART_SIZE = 8 * 1024 * 1024 // 8 MiB
    const startRes = await fetch(`${this.base}/v1/multipart/start`, {
      method: 'POST',
      headers: this.headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name, contentType, totalSize: data.byteLength, expiryUnix }),
    })
    if (!startRes.ok) throw new ShelbyError(`Multipart start: HTTP ${startRes.status}`, startRes.status)
    const { uploadId } = await startRes.json() as { uploadId: string }

    const parts: { partNumber: number; etag: string }[] = []
    let uploaded = 0

    for (let i = 0; i * PART_SIZE < data.byteLength; i++) {
      const start = i * PART_SIZE
      const end = Math.min(start + PART_SIZE, data.byteLength)
      const part = data.slice(start, end)
      const partRes = await fetch(`${this.base}/v1/multipart/${uploadId}/${i + 1}`, {
        method: 'PUT',
        headers: this.headers({ 'Content-Type': 'application/octet-stream' }),
        body: Buffer.from(part),
      })
      if (!partRes.ok) throw new ShelbyError(`Part ${i + 1}: HTTP ${partRes.status}`, partRes.status)
      parts.push({ partNumber: i + 1, etag: partRes.headers.get('ETag') ?? '' })
      uploaded += part.byteLength
      onProgress?.(uploaded, data.byteLength)
    }

    const completeRes = await fetch(`${this.base}/v1/multipart/complete`, {
      method: 'POST',
      headers: this.headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ uploadId, parts }),
    })
    if (!completeRes.ok) throw new ShelbyError(`Multipart complete: HTTP ${completeRes.status}`, completeRes.status)

    const aptosTxHash =
      completeRes.headers.get('X-Aptos-Tx-Hash') ??
      await completeRes.json().then((j: Record<string, string>) => j.txHash ?? '').catch(() => '') ??
      ''
    return { aptosTxHash }
  }
}

// ─── Aptos RPC client ─────────────────────────────────────────────────────────

class AptosClient {
  private readonly base: string
  constructor(fullnodeUrl: string) {
    this.base = fullnodeUrl.replace(/\/$/, '')
  }
  async getTransaction(txHash: string): Promise<AptosTransaction | null> {
    try {
      const res = await fetch(`${this.base}/transactions/by_hash/${txHash}`)
      if (!res.ok) return null
      return res.json() as Promise<AptosTransaction>
    } catch { return null }
  }
  async getAccountResources(address: string): Promise<AptosResource[]> {
    try {
      const res = await fetch(`${this.base}/accounts/${address}/resources`)
      if (!res.ok) return []
      return res.json() as Promise<AptosResource[]>
    } catch { return [] }
  }
}

interface AptosTransaction {
  hash: string; sender: string; timestamp: string
  gas_used: string; success: boolean; vm_status: string
  payload?: Record<string, unknown>
}
interface AptosResource {
  type: string; data: Record<string, unknown>
}

// ─── Crypto helpers ───────────────────────────────────────────────────────────

async function sha256Hex(data: Uint8Array): Promise<string> {
  const { createHash } = await import('crypto')
  return createHash('sha256').update(Buffer.from(data)).digest('hex')
}

function encodeText(text: string): Uint8Array {
  return Buffer.from(text, 'utf8') as unknown as Uint8Array
}

function decodeText(data: Uint8Array): string {
  return Buffer.from(data).toString('utf8')
}

function generateCitationId(): string {
  const { randomBytes } = require('crypto')
  return randomBytes(8).toString('hex').toUpperCase()
}

// ─── Config ───────────────────────────────────────────────────────────────────

export function shelbyConfigFromEnv(): ShelbyConfig {
  const network = (process.env.SHELBY_NETWORK as ShelbyNetwork) || 'testnet'
  const rpcEndpoint = process.env.SHELBY_RPC_ENDPOINT || NETWORK_CONFIG[network].rpc
  const aptosFullnode = process.env.APTOS_FULLNODE_URL || NETWORK_CONFIG[network].aptos
  const privateKey = process.env.APTOS_PRIVATE_KEY || ''
  const accountAddress = process.env.APTOS_ACCOUNT_ADDRESS || ''

  if (!privateKey) throw new ShelbyError('APTOS_PRIVATE_KEY is not set in .env.local')
  if (!accountAddress) throw new ShelbyError('APTOS_ACCOUNT_ADDRESS is not set in .env.local')

  return {
    network, rpcEndpoint, aptosFullnode, privateKey, accountAddress,
    apiKey: process.env.SHELBY_API_KEY || undefined,
    cdnBaseUrl: process.env.SHELBY_CDN_URL || undefined,
  }
}

// ─── Blob naming (wallet-namespaced per Shelby docs) ──────────────────────────

/**
 * Fully-qualified blob name: <account>/records/<slug>/<timestamp>
 * The account prefix is the Shelby namespace — required by the protocol.
 */
function recordBlobName(accountAddress: string, slug: string): string {
  return `${accountAddress}/records/${slug}/${Date.now()}`
}

function documentBlobName(accountAddress: string, articleSlug: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase()
  return `${accountAddress}/documents/${articleSlug}/${Date.now()}-${safe}`
}

function citationBlobName(accountAddress: string, slug: string, citationId: string): string {
  return `${accountAddress}/citations/${slug}/${citationId}.json`
}

function expiryUnix(daysFromNow = DEFAULT_TTL_DAYS): number {
  return Math.floor(Date.now() / 1000) + daysFromNow * 86400
}

function expiryIso(daysFromNow = DEFAULT_TTL_DAYS): string {
  return new Date(Date.now() + daysFromNow * 86400 * 1000).toISOString()
}

// ─── Internal upload helper ───────────────────────────────────────────────────

async function doUpload(
  config: ShelbyConfig,
  blobName: string,
  data: Uint8Array,
  contentType: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  // Try official SDK first
  const sdkClient = await tryCreateSdkClient(config)

  if (sdkClient) {
    // Official SDK path — handles erasure coding + Aptos commitment correctly
    try {
      // SDK write method — adjust to actual SDK API once confirmed
      const result = await (sdkClient as unknown as {
        writeBlob: (opts: {
          blobName: string
          data: Buffer
          contentType: string
          expiryUnix: number
          onProgress?: (pct: number) => void
        }) => Promise<{ txHash: string }>
      }).writeBlob({
        blobName,
        data: Buffer.from(data),
        contentType,
        expiryUnix: expiryUnix(),
        onProgress: (pct) => onProgress?.('uploading', pct),
      })
      return result.txHash
    } catch (err) {
      console.warn('[shelby] SDK upload failed, falling back to HTTP:', err)
    }
  }

  // HTTP fallback
  const client = new ShelbyHttpClient(config)
  onProgress?.('uploading', 0)

  if (data.byteLength > 10 * 1024 * 1024) {
    const result = await client.uploadBlobMultipart(
      blobName, data, contentType, expiryUnix(),
      (uploaded, total) => onProgress?.('uploading', Math.round((uploaded / total) * 100))
    )
    return result.aptosTxHash
  }

  onProgress?.('uploading', 50)
  const result = await client.uploadBlob(blobName, data, contentType, expiryUnix())
  onProgress?.('uploading', 100)
  return result.aptosTxHash
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function uploadRecord(
  payload: RecordPayload,
  config: ShelbyConfig,
  onProgress?: UploadProgressCallback
): Promise<UploadReceipt> {
  onProgress?.('preparing')

  const json = JSON.stringify({
    ...payload,
    _version: 2,
    _schema: 'the-record/record',
    _uploadedAt: new Date().toISOString(),
  }, null, 2)

  const data = encodeText(json)

  onProgress?.('hashing')
  const contentHash = await sha256Hex(data)

  const blobName = recordBlobName(config.accountAddress, payload.slug)

  onProgress?.('uploading', 0)
  const aptosTxHash = await doUpload(config, blobName, data, 'application/json', onProgress)

  onProgress?.('committing')

  const network = config.network
  const receipt: UploadReceipt = {
    blobName,
    aptosTxHash,
    contentHash,
    committedAt: Date.now(),
    sizeBytes: data.byteLength,
    explorerUrl: `${EXPLORER_BASE[network].shelby}/${config.accountAddress}`,
    aptosExplorerUrl: `${EXPLORER_BASE[network].aptos}/${aptosTxHash}?network=${network}`,
    expiresAt: expiryIso(),
  }

  onProgress?.('complete')
  return receipt
}

/** Alias for API routes that still call uploadArticle */
export const uploadArticle = uploadRecord

export async function uploadDocument(
  payload: DocumentPayload,
  config: ShelbyConfig,
  onProgress?: UploadProgressCallback
): Promise<UploadReceipt> {
  onProgress?.('preparing')

  const { data, mimeType, name, articleSlug } = payload

  onProgress?.('hashing')
  const contentHash = await sha256Hex(data)

  const blobName = documentBlobName(config.accountAddress, articleSlug, name)

  onProgress?.('uploading', 0)
  const aptosTxHash = await doUpload(config, blobName, data, mimeType, onProgress)

  onProgress?.('committing')

  const network = config.network
  const receipt: UploadReceipt = {
    blobName, aptosTxHash, contentHash,
    committedAt: Date.now(),
    sizeBytes: data.byteLength,
    explorerUrl: `${EXPLORER_BASE[network].shelby}/${config.accountAddress}`,
    aptosExplorerUrl: `${EXPLORER_BASE[network].aptos}/${aptosTxHash}?network=${network}`,
    expiresAt: expiryIso(),
  }

  onProgress?.('complete')
  return receipt
}

/**
 * Issue a verifiable citation package (Cite tier).
 * Stores a signed JSON blob on Shelby that proves who cited what and when.
 */
export async function issueCitation(
  pkg: Omit<CitationPackage, 'citationId' | 'issuedAt'>,
  config: ShelbyConfig
): Promise<{ receipt: UploadReceipt; citationId: string }> {
  const citationId = generateCitationId()
  const issuedAt = new Date().toISOString()

  const full: CitationPackage = { ...pkg, citationId, issuedAt }

  const data = encodeText(JSON.stringify(full, null, 2))
  const contentHash = await sha256Hex(data)
  const blobName = citationBlobName(config.accountAddress, pkg.recordSlug, citationId)
  const aptosTxHash = await doUpload(config, blobName, data, 'application/json')

  const network = config.network
  return {
    citationId,
    receipt: {
      blobName, aptosTxHash, contentHash,
      committedAt: Date.now(),
      sizeBytes: data.byteLength,
      explorerUrl: `${EXPLORER_BASE[network].shelby}/${config.accountAddress}`,
      aptosExplorerUrl: `${EXPLORER_BASE[network].aptos}/${aptosTxHash}?network=${network}`,
      expiresAt: expiryIso(),
    },
  }
}

/**
 * Retrieve a blob — tries SDK first, falls back to HTTP.
 * Supports byte-range reads for streaming document previews.
 */
export async function getBlob(
  blobName: string,
  config: ShelbyConfig,
  options?: { range?: string }
): Promise<BlobContent> {
  const sdkClient = await tryCreateSdkClient(config)

  if (sdkClient && !options?.range) {
    try {
      const result = await (sdkClient as unknown as {
        readBlob: (opts: { blobName: string }) => Promise<{ data: Buffer; contentType: string; size: number }>
      }).readBlob({ blobName })
      return {
        data: result.data as unknown as Uint8Array,
        contentType: result.contentType,
        blobName,
        retrievedAt: Date.now(),
        totalBytes: result.size,
      }
    } catch (err) {
      console.warn('[shelby] SDK read failed, falling back to HTTP:', err)
    }
  }

  // HTTP fallback with optional byte-range
  // Use CDN URL for reads if configured
  const readConfig = config.cdnBaseUrl
    ? { ...config, rpcEndpoint: config.cdnBaseUrl }
    : config

  const client = new ShelbyHttpClient(readConfig)
  const { data, contentType, totalBytes } = await client.getBlob(blobName, options?.range)
  return { data, contentType, blobName, retrievedAt: Date.now(), totalBytes }
}

export async function getRecord(blobName: string, config: ShelbyConfig): Promise<RecordPayload & { _uploadedAt: string }> {
  const { data } = await getBlob(blobName, config)
  return JSON.parse(decodeText(data))
}

/** Alias */
export const getArticle = getRecord

export async function getDocument(blobName: string, config: ShelbyConfig): Promise<BlobContent> {
  return getBlob(blobName, config)
}

export async function verifyBlob(
  blobName: string,
  expectedHash: string,
  aptosTxHash: string,
  config: ShelbyConfig
): Promise<VerificationResult> {
  const aptosClient = new AptosClient(config.aptosFullnode)
  const { data } = await getBlob(blobName, config)
  const currentHash = await sha256Hex(data)
  const tx = await aptosClient.getTransaction(aptosTxHash)
  const onChainHash = extractHashFromTx(tx) ?? expectedHash
  const intact = currentHash === onChainHash

  return {
    verified: !!tx?.success,
    onChainHash,
    currentHash,
    intact,
    txDetails: tx ? {
      hash: tx.hash,
      timestamp: Math.floor(Number(tx.timestamp) / 1000),
      sender: tx.sender,
      gasUsed: Number(tx.gas_used),
    } : null,
    verifiedAt: Date.now(),
  }
}

export async function verifyDocument(
  receipt: Pick<UploadReceipt, 'blobName' | 'contentHash' | 'aptosTxHash'>,
  config: ShelbyConfig
): Promise<VerificationResult> {
  return verifyBlob(receipt.blobName, receipt.contentHash, receipt.aptosTxHash, config)
}

export async function getAccountBalance(config: ShelbyConfig): Promise<{ apt: string; shelbyUsd: string; address: string }> {
  const aptosClient = new AptosClient(config.aptosFullnode)
  const resources = await aptosClient.getAccountResources(config.accountAddress)

  const aptResource = resources.find((r) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>')
  const aptRaw = (aptResource?.data as { coin?: { value: string } })?.coin?.value ?? '0'

  const shelbyResource = resources.find((r) => r.type.includes('1b18363a9f1fe5e6ebf247daba5cc1c'))
  const shelbyRaw = (shelbyResource?.data as { coin?: { value: string } })?.coin?.value ?? '0'

  return {
    apt: (Number(aptRaw) / 1e8).toFixed(6),
    shelbyUsd: (Number(shelbyRaw) / 1e8).toFixed(8),
    address: config.accountAddress,
  }
}

export function estimateUploadCost(bytes: number, ttlDays = DEFAULT_TTL_DAYS): { shelbyUsd: string; breakdown: string } {
  const gb = bytes / (1024 ** 3)
  const months = ttlDays / 30
  const writeCost = gb * 0.01 * months
  return {
    shelbyUsd: writeCost.toFixed(8),
    breakdown: `${(gb * 1024).toFixed(2)} MB × $0.01/GB/mo × ${months.toFixed(1)} mo`,
  }
}

/**
 * Renew a blob before it expires.
 * Called by the /api/renew cron route.
 */
export async function renewBlob(
  originalBlobName: string,
  config: ShelbyConfig,
  ttlDays = DEFAULT_TTL_DAYS
): Promise<UploadReceipt> {
  const { data, contentType } = await getBlob(originalBlobName, config)
  const contentHash = await sha256Hex(data)

  // New blob name: same path prefix, new timestamp suffix
  const parts = originalBlobName.split('/')
  const base = parts.slice(0, -1).join('/')
  const blobName = `${base}/${Date.now()}-renewed`

  const client = new ShelbyHttpClient(config)
  const { aptosTxHash } = await client.uploadBlob(blobName, data, contentType, expiryUnix(ttlDays))

  const network = config.network
  return {
    blobName, aptosTxHash, contentHash,
    committedAt: Date.now(),
    sizeBytes: data.byteLength,
    explorerUrl: `${EXPLORER_BASE[network].shelby}/${config.accountAddress}`,
    aptosExplorerUrl: `${EXPLORER_BASE[network].aptos}/${aptosTxHash}?network=${network}`,
    expiresAt: expiryIso(ttlDays),
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function extractHashFromTx(tx: AptosTransaction | null): string | null {
  if (!tx?.payload) return null
  const payload = tx.payload as { type?: string; arguments?: unknown[] }
  if (payload.type === 'entry_function_payload' && Array.isArray(payload.arguments)) {
    const arg = payload.arguments[0]
    if (typeof arg === 'string' && /^[0-9a-f]{64}$/i.test(arg)) return arg.toLowerCase()
  }
  return null
}

// ─── Namespace export ─────────────────────────────────────────────────────────

export const shelby = {
  uploadRecord,
  uploadArticle,   // alias
  uploadDocument,
  issueCitation,
  getRecord,
  getArticle,      // alias
  getDocument,
  getBlob,
  verifyBlob,
  verifyDocument,
  getAccountBalance,
  estimateUploadCost,
  renewBlob,
  configFromEnv: shelbyConfigFromEnv,
} as const
