/**
 * Copyright (C) 2026 [YOUR FULL LEGAL NAME OR COMPANY NAME]
 * Licensed under the Business Source License 1.1 — see LICENSE for terms.
 *
 * lib/shelby.ts
 *
 * The Record — Shelby Protocol integration layer
 *
 * Handles all interaction with Shelby Protocol (decentralised blob storage on
 * Aptos) and the Aptos chain itself. Every function here is server-side only
 * (Node.js / Next.js API routes / Server Actions). Never import this file from
 * a 'use client' component.
 *
 * Architecture
 * ─────────────
 * ShelbyClient  — low-level HTTP wrapper around the Shelby RPC API
 * AptosClient   — thin wrapper for Aptos fullnode reads we need
 * shelby.*      — high-level helpers used by the rest of the app
 *
 * When @shelby-protocol/sdk ships a stable API, replace ShelbyClient internals
 * with the official SDK while keeping the public surface identical.
 *
 * Network topology (from docs.shelby.xyz)
 * ─────────────────────────────────────────
 *   testnet  → https://api.testnet.shelby.xyz/shelby
 *              https://api.testnet.aptoslabs.com/v1
 *
 *   shelbynet → https://api.shelbynet.shelby.xyz/shelby
 *               https://api.shelbynet.shelby.xyz/v1
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShelbyNetwork = 'testnet' | 'shelbynet' | 'local'

export interface ShelbyConfig {
  rpcEndpoint: string       // Shelby RPC base URL
  aptosFullnode: string     // Aptos fullnode URL
  privateKey: string        // ed25519-priv-0x…
  accountAddress: string    // 0x…
  apiKey?: string           // Optional — avoids rate limits
  network: ShelbyNetwork
}

/** Returned after a successful article or document upload */
export interface UploadReceipt {
  /** Shelby blob name — used to retrieve the content later */
  blobName: string
  /** Aptos transaction hash from the commitment */
  aptosTxHash: string
  /** SHA-256 hex digest of the raw content bytes */
  contentHash: string
  /** Unix timestamp (ms) of when the upload was committed */
  committedAt: number
  /** Friendly URL to verify on Shelby explorer */
  explorerUrl: string
  /** Friendly URL to verify on Aptos explorer */
  aptosExplorerUrl: string
  /** Expiry date (ISO string) — blobs must be renewed before this */
  expiresAt: string
}

/** Result of retrieving a blob from Shelby */
export interface BlobContent {
  data: Uint8Array
  contentType: string
  blobName: string
  retrievedAt: number
}

/** On-chain verification result */
export interface VerificationResult {
  verified: boolean
  /** Hash stored on-chain at the time of original commit */
  onChainHash: string
  /** Hash of the blob as retrieved right now */
  currentHash: string
  /** Whether the two hashes match */
  intact: boolean
  /** Aptos transaction details */
  txDetails: {
    hash: string
    timestamp: number
    sender: string
    gasUsed: number
  } | null
  verifiedAt: number
}

export interface ArticlePayload {
  slug: string
  title: string
  body: string
  authorAddress: string
  publishedAt: string
  accessModel: 'free' | 'pay-per-article' | 'subscription'
  price?: string
  tags: string[]
}

export interface DocumentPayload {
  name: string
  mimeType: string
  data: Uint8Array
  sourceDescription: string
  articleSlug: string
}

/** Progress callback shape — used by the multi-step upload UI */
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
    aptos: 'https://explorer.aptoslabs.com/txn',
  },
  shelbynet: {
    shelby: 'https://explorer.shelby.xyz/shelbynet/account',
    aptos: 'https://explorer.aptoslabs.com/txn',
  },
  local: {
    shelby: 'http://localhost:3001/account',
    aptos: 'http://localhost:8080/txn',
  },
}

/**
 * Default blob TTL. Shelby requires an expiry on every upload.
 * 365 days is a good baseline; renew via the archive renewal job.
 */
const DEFAULT_TTL_DAYS = 365

// ─── Low-level: ShelbyClient ─────────────────────────────────────────────────

/**
 * Minimal HTTP client for the Shelby RPC API.
 *
 * Shelby RPC API surface (from docs.shelby.xyz/apis/rpc/shelbynet):
 *   Sessions:
 *     POST /sessions/use       — consume a session token
 *     POST /sessions/create    — create a new session
 *     POST /sessions/channel   — create a micropayment channel
 *   Storage:
 *     PUT  /blobs/:name        — upload a blob
 *     GET  /blobs/:name        — retrieve a blob
 *   Multipart:
 *     POST /multipart/start    — begin multipart upload (>10 MiB)
 *     PUT  /multipart/:id/:n   — upload a part
 *     POST /multipart/complete — finalise multipart upload
 */
class ShelbyClient {
  private readonly base: string
  private readonly apiKey?: string
  private readonly accountAddress: string

  constructor(config: ShelbyConfig) {
    this.base = config.rpcEndpoint.replace(/\/$/, '')
    this.apiKey = config.apiKey
    this.accountAddress = config.accountAddress
  }

  private headers(extra: Record<string, string> = {}): HeadersInit {
    return {
      ...(this.apiKey ? { 'X-API-Key': this.apiKey } : {}),
      'X-Account-Address': this.accountAddress,
      ...extra,
    }
  }

  /**
   * Upload a blob.
   *
   * PUT /blobs/:name
   * Headers: Content-Type, X-Expiry-Unix (UTC unix timestamp), X-Account-Address
   * Body: raw bytes
   *
   * Returns the Aptos transaction hash from the X-Aptos-Tx-Hash response header.
   */
  async uploadBlob(
    name: string,
    data: Uint8Array,
    contentType: string,
    expiryUnix: number
  ): Promise<{ aptosTxHash: string }> {
    const url = `${this.base}/blobs/${encodeURIComponent(name)}`

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
      throw new ShelbyError(
        `Upload failed: HTTP ${res.status}${body ? ` — ${body}` : ''}`,
        res.status
      )
    }

    // The Shelby RPC returns the Aptos tx hash in a response header
    const aptosTxHash =
      res.headers.get('X-Aptos-Tx-Hash') ||
      res.headers.get('x-aptos-tx-hash') ||
      (await res.json().then((j: Record<string,string>) => j.txHash || j.tx_hash).catch(() => null)) ||
      ''

    return { aptosTxHash }
  }

  /**
   * Retrieve a blob.
   * GET /blobs/:name
   */
  async getBlob(name: string): Promise<{ data: Uint8Array; contentType: string }> {
    const url = `${this.base}/blobs/${encodeURIComponent(name)}`

    const res = await fetch(url, {
      method: 'GET',
      headers: this.headers(),
    })

    if (!res.ok) {
      throw new ShelbyError(`Get blob failed: HTTP ${res.status}`, res.status)
    }

    const contentType = res.headers.get('Content-Type') ?? 'application/octet-stream'
    const buffer = await res.arrayBuffer()
    return { data: new Uint8Array(buffer), contentType }
  }

  /**
   * Multipart upload for blobs > 10 MiB.
   * Shelby chunks at ~10 MiB (chunksets) → ~1 MiB (chunks).
   * We split at PART_SIZE and use the multipart API.
   */
  async uploadBlobMultipart(
    name: string,
    data: Uint8Array,
    contentType: string,
    expiryUnix: number,
    onProgress?: (bytesUploaded: number, total: number) => void
  ): Promise<{ aptosTxHash: string }> {
    const PART_SIZE = 8 * 1024 * 1024 // 8 MiB parts

    // 1. Start multipart
    const startRes = await fetch(`${this.base}/multipart/start`, {
      method: 'POST',
      headers: this.headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        name,
        contentType,
        totalSize: data.byteLength,
        expiryUnix,
      }),
    })
    if (!startRes.ok) throw new ShelbyError(`Multipart start failed: HTTP ${startRes.status}`, startRes.status)
    const { uploadId } = await startRes.json() as { uploadId: string }

    // 2. Upload parts
    const parts: { partNumber: number; etag: string }[] = []
    let uploaded = 0

    for (let i = 0; i * PART_SIZE < data.byteLength; i++) {
      const start = i * PART_SIZE
      const end = Math.min(start + PART_SIZE, data.byteLength)
      const part = data.slice(start, end)
      const partNumber = i + 1

      const partRes = await fetch(`${this.base}/multipart/${uploadId}/${partNumber}`, {
        method: 'PUT',
        headers: this.headers({ 'Content-Type': 'application/octet-stream' }),
        body: Buffer.from(part),
      })
      if (!partRes.ok) throw new ShelbyError(`Part ${partNumber} upload failed: HTTP ${partRes.status}`, partRes.status)

      const etag = partRes.headers.get('ETag') ?? partRes.headers.get('etag') ?? ''
      parts.push({ partNumber, etag })
      uploaded += part.byteLength
      onProgress?.(uploaded, data.byteLength)
    }

    // 3. Complete
    const completeRes = await fetch(`${this.base}/multipart/complete`, {
      method: 'POST',
      headers: this.headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ uploadId, parts }),
    })
    if (!completeRes.ok) throw new ShelbyError(`Multipart complete failed: HTTP ${completeRes.status}`, completeRes.status)

    const aptosTxHash =
      completeRes.headers.get('X-Aptos-Tx-Hash') ||
      (await completeRes.json().then((j: Record<string,string>) => j.txHash || j.tx_hash).catch(() => ''))

    return { aptosTxHash }
  }
}

// ─── Low-level: AptosClient ──────────────────────────────────────────────────

class AptosClient {
  private readonly base: string

  constructor(fullnodeUrl: string) {
    this.base = fullnodeUrl.replace(/\/$/, '')
  }

  /**
   * Fetch transaction details by hash.
   * GET /v1/transactions/by_hash/:txn_hash
   */
  async getTransaction(txHash: string): Promise<AptosTransaction | null> {
    try {
      const res = await fetch(`${this.base}/transactions/by_hash/${txHash}`)
      if (!res.ok) return null
      return res.json() as Promise<AptosTransaction>
    } catch {
      return null
    }
  }

  /**
   * Fetch account resources — used to read on-chain state.
   * GET /v1/accounts/:address/resources
   */
  async getAccountResources(address: string): Promise<AptosResource[]> {
    const res = await fetch(`${this.base}/accounts/${address}/resources`)
    if (!res.ok) return []
    return res.json() as Promise<AptosResource[]>
  }
}

interface AptosTransaction {
  hash: string
  sender: string
  timestamp: string  // microseconds since epoch
  gas_used: string
  success: boolean
  vm_status: string
  payload?: Record<string, unknown>
}

interface AptosResource {
  type: string
  data: Record<string, unknown>
}

// ─── Crypto helpers ───────────────────────────────────────────────────────────

/**
 * SHA-256 hash of arbitrary bytes.
 * Uses Node.js crypto (server-side only).
 */
async function sha256Hex(data: Uint8Array): Promise<string> {
  // Node 18+: crypto is available as a global via globalThis.crypto (Web Crypto API)
  // or via require('crypto'). We prefer the Web Crypto path for edge compatibility.
  if (typeof globalThis.crypto?.subtle !== 'undefined') {
    const buf = await globalThis.crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  // Fallback: Node.js crypto module
  const { createHash } = await import('crypto')
  return createHash('sha256').update(data).digest('hex')
}

/**
 * Encode a string payload to UTF-8 bytes.
 */
function encodeText(text: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(text)
  }
  return Buffer.from(text, 'utf8')
}

/**
 * Decode bytes to a string.
 */
function decodeText(data: Uint8Array): string {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder().decode(data)
  }
  return Buffer.from(data).toString('utf8')
}

// ─── Error class ─────────────────────────────────────────────────────────────

export class ShelbyError extends Error {
  readonly statusCode?: number

  constructor(message: string, statusCode?: number) {
    super(message)
    this.name = 'ShelbyError'
    this.statusCode = statusCode
  }
}

// ─── Config builder ───────────────────────────────────────────────────────────

/**
 * Build a ShelbyConfig from environment variables.
 * Call this at the top of any API route or Server Action that needs Shelby.
 *
 * Throws clearly if required vars are missing — fast fail beats cryptic errors.
 */
export function shelbyConfigFromEnv(): ShelbyConfig {
  const network = (process.env.SHELBY_NETWORK as ShelbyNetwork) || 'testnet'
  const networkDefaults = NETWORK_CONFIG[network]

  const rpcEndpoint =
    process.env.SHELBY_RPC_ENDPOINT || networkDefaults.rpc
  const aptosFullnode =
    process.env.APTOS_FULLNODE_URL || networkDefaults.aptos
  const privateKey = process.env.APTOS_PRIVATE_KEY || ''
  const accountAddress = process.env.APTOS_ACCOUNT_ADDRESS || ''

  if (!privateKey) {
    throw new ShelbyError(
      'APTOS_PRIVATE_KEY is not set. Add it to .env.local (see .env.example).'
    )
  }
  if (!accountAddress) {
    throw new ShelbyError(
      'APTOS_ACCOUNT_ADDRESS is not set. Add it to .env.local (see .env.example).'
    )
  }

  return {
    network,
    rpcEndpoint,
    aptosFullnode,
    privateKey,
    accountAddress,
    apiKey: process.env.SHELBY_API_KEY,
  }
}

// ─── Blob name helpers ────────────────────────────────────────────────────────

/**
 * Deterministic blob name for an article.
 * Format: articles/<slug>/<version-timestamp>
 * Keeping the slug in the path makes the Shelby explorer human-readable.
 */
function articleBlobName(slug: string): string {
  return `articles/${slug}/${Date.now()}`
}

/**
 * Deterministic blob name for a source document.
 * Format: documents/<article-slug>/<sanitised-filename>
 */
function documentBlobName(articleSlug: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase()
  return `documents/${articleSlug}/${Date.now()}-${safe}`
}

/**
 * Blob expiry as a Unix timestamp (seconds).
 * Default: DEFAULT_TTL_DAYS from now.
 */
function expiryUnix(daysFromNow = DEFAULT_TTL_DAYS): number {
  return Math.floor(Date.now() / 1000) + daysFromNow * 86400
}

/**
 * Expiry as a human-readable ISO date string.
 */
function expiryIso(daysFromNow = DEFAULT_TTL_DAYS): string {
  return new Date(Date.now() + daysFromNow * 86400 * 1000).toISOString()
}

// ─── High-level API ───────────────────────────────────────────────────────────

/**
 * Upload a full article (title + body + metadata) to Shelby as a JSON blob.
 *
 * Flow:
 *   1. Serialise ArticlePayload → JSON → UTF-8 bytes
 *   2. SHA-256 hash the bytes
 *   3. PUT /blobs/:name (or multipart if > 10 MiB — unlikely for text)
 *   4. Return UploadReceipt with Aptos tx hash + content hash
 *
 * The Aptos tx hash is what gets stored in the DB / displayed to readers
 * as proof that this article existed at this exact content at this moment.
 */
export async function uploadArticle(
  payload: ArticlePayload,
  config: ShelbyConfig,
  onProgress?: UploadProgressCallback
): Promise<UploadReceipt> {
  onProgress?.('preparing')

  const json = JSON.stringify({
    ...payload,
    _version: 1,
    _schema: 'the-record/article',
    _uploadedAt: new Date().toISOString(),
  }, null, 2)

  const data = encodeText(json)

  onProgress?.('hashing')
  const contentHash = await sha256Hex(data)

  const blobName = articleBlobName(payload.slug)
  const expiry = expiryUnix()

  const client = new ShelbyClient(config)

  onProgress?.('uploading', 0)

  let aptosTxHash: string

  if (data.byteLength > 10 * 1024 * 1024) {
    // Shouldn't happen for articles, but handle gracefully
    const result = await client.uploadBlobMultipart(
      blobName, data, 'application/json', expiry,
      (uploaded, total) => {
        onProgress?.('uploading', Math.round((uploaded / total) * 100))
      }
    )
    aptosTxHash = result.aptosTxHash
  } else {
    onProgress?.('uploading', 50)
    const result = await client.uploadBlob(blobName, data, 'application/json', expiry)
    aptosTxHash = result.aptosTxHash
    onProgress?.('uploading', 100)
  }

  onProgress?.('committing')

  const network = config.network
  const receipt: UploadReceipt = {
    blobName,
    aptosTxHash,
    contentHash,
    committedAt: Date.now(),
    explorerUrl: `${EXPLORER_BASE[network].shelby}/${config.accountAddress}`,
    aptosExplorerUrl: `${EXPLORER_BASE[network].aptos}/${aptosTxHash}?network=${network}`,
    expiresAt: expiryIso(),
  }

  onProgress?.('complete')
  return receipt
}

/**
 * Upload a source document (PDF, CSV, image, etc.) to Shelby.
 *
 * Documents are stored separately from articles so they can be verified
 * independently. Each gets its own Aptos tx hash.
 */
export async function uploadDocument(
  payload: DocumentPayload,
  config: ShelbyConfig,
  onProgress?: UploadProgressCallback
): Promise<UploadReceipt> {
  onProgress?.('preparing')

  const { data, mimeType, name, articleSlug } = payload

  onProgress?.('hashing')
  const contentHash = await sha256Hex(data)

  const blobName = documentBlobName(articleSlug, name)
  const expiry = expiryUnix()
  const client = new ShelbyClient(config)

  onProgress?.('uploading', 0)

  let aptosTxHash: string

  if (data.byteLength > 10 * 1024 * 1024) {
    const result = await client.uploadBlobMultipart(
      blobName, data, mimeType, expiry,
      (uploaded, total) => {
        onProgress?.('uploading', Math.round((uploaded / total) * 100))
      }
    )
    aptosTxHash = result.aptosTxHash
  } else {
    onProgress?.('uploading', 50)
    const result = await client.uploadBlob(blobName, data, mimeType, expiry)
    aptosTxHash = result.aptosTxHash
    onProgress?.('uploading', 100)
  }

  onProgress?.('committing')

  const network = config.network
  const receipt: UploadReceipt = {
    blobName,
    aptosTxHash,
    contentHash,
    committedAt: Date.now(),
    explorerUrl: `${EXPLORER_BASE[network].shelby}/${config.accountAddress}`,
    aptosExplorerUrl: `${EXPLORER_BASE[network].aptos}/${aptosTxHash}?network=${network}`,
    expiresAt: expiryIso(),
  }

  onProgress?.('complete')
  return receipt
}

/**
 * Retrieve an article blob by name and deserialise.
 */
export async function getArticle(
  blobName: string,
  config: ShelbyConfig
): Promise<ArticlePayload & { _uploadedAt: string }> {
  const client = new ShelbyClient(config)
  const { data } = await client.getBlob(blobName)
  const json = decodeText(data)
  return JSON.parse(json)
}

/**
 * Retrieve a document blob as raw bytes.
 */
export async function getDocument(
  blobName: string,
  config: ShelbyConfig
): Promise<BlobContent> {
  const client = new ShelbyClient(config)
  const { data, contentType } = await client.getBlob(blobName)
  return {
    data,
    contentType,
    blobName,
    retrievedAt: Date.now(),
  }
}

/**
 * Verify that a blob's current content matches its on-chain commitment.
 *
 * Steps:
 *   1. Retrieve the blob from Shelby
 *   2. SHA-256 hash the retrieved bytes
 *   3. Fetch the original Aptos transaction and extract the committed hash
 *      from the transaction payload
 *   4. Compare — if they match, the document is intact
 *
 * Note: Step 3 depends on how The Record's smart contract stores the hash.
 * Until the contract is deployed, we compare against the locally-stored
 * contentHash from the UploadReceipt. The structure is ready for the
 * on-chain path once the contract is live.
 */
export async function verifyBlob(
  blobName: string,
  /** The SHA-256 hex from the original UploadReceipt */
  expectedHash: string,
  aptosTxHash: string,
  config: ShelbyConfig
): Promise<VerificationResult> {
  // 1. Retrieve current blob
  const client = new ShelbyClient(config)
  const aptosClient = new AptosClient(config.aptosFullnode)

  const { data } = await client.getBlob(blobName)

  // 2. Hash what we got back
  const currentHash = await sha256Hex(data)

  // 3. Fetch on-chain tx to extract committed hash
  const tx = await aptosClient.getTransaction(aptosTxHash)

  // If the tx payload embeds the hash (after contract deployment),
  // extract it. Until then, fall back to expectedHash.
  const onChainHash = extractHashFromTx(tx) ?? expectedHash

  // 4. Compare
  const intact = currentHash === onChainHash

  return {
    verified: !!tx?.success,
    onChainHash,
    currentHash,
    intact,
    txDetails: tx
      ? {
          hash: tx.hash,
          // Aptos timestamps are in microseconds
          timestamp: Math.floor(Number(tx.timestamp) / 1000),
          sender: tx.sender,
          gasUsed: Number(tx.gas_used),
        }
      : null,
    verifiedAt: Date.now(),
  }
}

/**
 * Extract a content hash from an Aptos transaction payload.
 *
 * Once The Record's on-chain contract is deployed, the publish transaction
 * will include a `content_hash` argument in the entry function payload.
 * Until then returns null.
 */
function extractHashFromTx(tx: AptosTransaction | null): string | null {
  if (!tx?.payload) return null
  const payload = tx.payload as {
    type?: string
    arguments?: unknown[]
  }
  // Entry function call: arguments[0] is the content hash bytes
  if (payload.type === 'entry_function_payload' && Array.isArray(payload.arguments)) {
    const arg = payload.arguments[0]
    if (typeof arg === 'string' && /^[0-9a-f]{64}$/i.test(arg)) {
      return arg.toLowerCase()
    }
  }
  return null
}

/**
 * Verify a document blob given a stored UploadReceipt.
 * Convenience wrapper around verifyBlob.
 */
export async function verifyDocument(
  receipt: Pick<UploadReceipt, 'blobName' | 'contentHash' | 'aptosTxHash'>,
  config: ShelbyConfig
): Promise<VerificationResult> {
  return verifyBlob(
    receipt.blobName,
    receipt.contentHash,
    receipt.aptosTxHash,
    config
  )
}

/**
 * Check the account's APT and ShelbyUSD balances.
 * Useful for the dashboard balance widget and pre-publish checks.
 */
export async function getAccountBalance(
  config: ShelbyConfig
): Promise<{ apt: string; shelbyUsd: string; address: string }> {
  const aptosClient = new AptosClient(config.aptosFullnode)
  const resources = await aptosClient.getAccountResources(config.accountAddress)

  // APT: 0x1::aptos_coin::AptosCoin
  const aptResource = resources.find(
    (r) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
  )
  const aptRaw = (aptResource?.data as { coin?: { value: string } })?.coin?.value ?? '0'
  const apt = (Number(aptRaw) / 1e8).toFixed(6)

  // ShelbyUSD: 0x1b18363a9f1fe5e6ebf247daba5cc1c18052bb232efdc4c50f556053922d98e1
  const shelbyResource = resources.find((r) =>
    r.type.includes('1b18363a9f1fe5e6ebf247daba5cc1c')
  )
  const shelbyRaw =
    (shelbyResource?.data as { coin?: { value: string } })?.coin?.value ?? '0'
  const shelbyUsd = (Number(shelbyRaw) / 1e8).toFixed(8)

  return {
    apt,
    shelbyUsd,
    address: config.accountAddress,
  }
}

/**
 * Estimate the cost (in ShelbyUSD) of uploading a payload of a given size.
 *
 * From Shelby docs:
 *   Reads:  ~$0.014 / GB
 *   Writes: <$0.01  / GB / month
 *
 * This is a rough client-side estimate; the actual cost is settled on-chain.
 */
export function estimateUploadCost(
  bytes: number,
  ttlDays = DEFAULT_TTL_DAYS
): { shelbyUsd: string; breakdown: string } {
  const gb = bytes / (1024 ** 3)
  const months = ttlDays / 30
  const writeCost = gb * 0.01 * months
  const shelbyUsd = writeCost.toFixed(8)
  const breakdown = `${(gb * 1024).toFixed(2)} MB × $0.01/GB/mo × ${months.toFixed(1)} mo`
  return { shelbyUsd, breakdown }
}

/**
 * Renew a blob's TTL by re-uploading it with a fresh expiry.
 *
 * Call this from the archive renewal cron job before blobs expire.
 * Returns a new UploadReceipt — store the new blobName in the DB.
 */
export async function renewBlob(
  originalBlobName: string,
  config: ShelbyConfig,
  ttlDays = DEFAULT_TTL_DAYS
): Promise<UploadReceipt> {
  const client = new ShelbyClient(config)
  const { data, contentType } = await client.getBlob(originalBlobName)
  const contentHash = await sha256Hex(data)

  // Re-upload under the same logical name with a new timestamp suffix
  const parts = originalBlobName.split('/')
  const base = parts.slice(0, -1).join('/')
  const blobName = `${base}/${Date.now()}-renewed`

  const expiry = expiryUnix(ttlDays)
  const { aptosTxHash } = await client.uploadBlob(blobName, data, contentType, expiry)

  const network = config.network
  return {
    blobName,
    aptosTxHash,
    contentHash,
    committedAt: Date.now(),
    explorerUrl: `${EXPLORER_BASE[network].shelby}/${config.accountAddress}`,
    aptosExplorerUrl: `${EXPLORER_BASE[network].aptos}/${aptosTxHash}?network=${network}`,
    expiresAt: expiryIso(ttlDays),
  }
}

// ─── Namespace export ─────────────────────────────────────────────────────────

/**
 * Convenience namespace — import as: import { shelby } from '@/lib/shelby'
 *
 * Usage in a Next.js Server Action:
 *
 *   import { shelby, shelbyConfigFromEnv } from '@/lib/shelby'
 *
 *   async function publishArticle(formData: FormData) {
 *     'use server'
 *     const config = shelbyConfigFromEnv()
 *     const receipt = await shelby.uploadArticle({ ... }, config, (stage) => {
 *       console.log('upload stage:', stage)
 *     })
 *     // Store receipt.aptosTxHash, receipt.blobName, receipt.contentHash in DB
 *   }
 */
export const shelby = {
  uploadArticle,
  uploadDocument,
  getArticle,
  getDocument,
  verifyBlob,
  verifyDocument,
  getAccountBalance,
  estimateUploadCost,
  renewBlob,
  configFromEnv: shelbyConfigFromEnv,
} as const
