/**
 * lib/shelby.ts  —  The Record × Shelby Protocol
 *
 * SERVER-SIDE ONLY. Never import from 'use client' components.
 *
 * Uses the official @shelby-protocol/sdk ShelbyNodeClient.
 * Correct API per docs: shelbyClient.upload({ account, blobData, blobName, expirationMicros })
 *
 * Blob naming convention:
 *   records/<slug>/<timestamp>
 *   documents/<slug>/<timestamp>-<filename>
 *   citations/<slug>/<timestamp>-cite.json
 */

export type ShelbyNetwork = 'testnet' | 'shelbynet' | 'local'

export class ShelbyError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message)
    this.name = 'ShelbyError'
  }
}

export interface ShelbyConfig {
  network: ShelbyNetwork
  apiKey?: string
  privateKey: string
  accountAddress: string
  aptosFullnode?: string
}

export interface UploadReceipt {
  blobName: string
  aptosTxHash: string
  contentHash: string
  committedAt: number
  explorerUrl: string
  aptosExplorerUrl: string
  expiresAt: string
  sizeBytes: number
}

export interface BlobContent {
  data: Uint8Array
  contentType: string
  blobName: string
  retrievedAt: number
  totalBytes?: number
}

export interface RecordPayload {
  slug: string
  title: string
  body: string
  excerpt?: string
  contentType?: string
  tags?: string[]
  priceView?: number
  priceCite?: number
  priceLicense?: number
  publisherAddress?: string
}

export type ArticlePayload = RecordPayload

export interface UploadProgressCallback {
  (stage: 'preparing' | 'uploading' | 'committing' | 'done', progress?: number): void
}

// 30 days from now in microseconds
function expiryMicros(): number {
  return (Date.now() + 1000 * 60 * 60 * 24 * 30) * 1000
}

function sha256Hex(data: Uint8Array): string {
  // Simple hex representation of byte array for content hash
  return Buffer.from(data).toString('hex').slice(0, 64)
}

function blobExplorerUrl(network: ShelbyNetwork, accountAddress: string): string {
  const base = network === 'shelbynet'
    ? 'https://explorer.shelby.xyz/shelbynet/account'
    : 'https://explorer.shelby.xyz/testnet/account'
  return `${base}/${accountAddress}`
}

function aptosExplorerUrl(network: ShelbyNetwork, txHash: string): string {
  const net = network === 'shelbynet' ? 'shelbynet' : 'testnet'
  return `https://explorer.aptoslabs.com/txn/${txHash}?network=${net}`
}

export function shelbyConfigFromEnv(): ShelbyConfig {
  const network = (process.env.SHELBY_NETWORK as ShelbyNetwork) || 'testnet'
  const privateKey = process.env.APTOS_PRIVATE_KEY || ''
  const accountAddress = process.env.APTOS_ACCOUNT_ADDRESS || ''
  if (!privateKey) throw new ShelbyError('APTOS_PRIVATE_KEY is not set')
  if (!accountAddress) throw new ShelbyError('APTOS_ACCOUNT_ADDRESS is not set')
  return {
    network,
    apiKey: process.env.SHELBY_API_KEY || undefined,
    privateKey,
    accountAddress,
    aptosFullnode: process.env.APTOS_FULLNODE_URL,
  }
}

// ─── Core upload using real SDK ───────────────────────────────────────────────

async function uploadToShelby(
  blobName: string,
  data: Uint8Array,
  config: ShelbyConfig,
  onProgress?: UploadProgressCallback
): Promise<UploadReceipt> {
  onProgress?.('preparing')

  try {
    const { ShelbyNodeClient } = await import('@shelby-protocol/sdk/node')
    const { Ed25519Account, Ed25519PrivateKey, Network } = await import('@aptos-labs/ts-sdk')

    // Map our network string to SDK Network enum
    const sdkNetwork = config.network === 'shelbynet' ? Network.SHELBYNET : Network.TESTNET

    // Build account from private key
    const account = new Ed25519Account({
      privateKey: new Ed25519PrivateKey(config.privateKey),
    })

    // Init client — only needs network + apiKey per docs
    const shelbyClient = new ShelbyNodeClient({
      network: sdkNetwork,
      ...(config.apiKey ? { apiKey: config.apiKey } : {}),
    })

    onProgress?.('uploading', 0)

    // Upload — correct SDK method per docs
    const result = await shelbyClient.upload({
      account,
      blobData: Buffer.from(data),
      blobName,
      expirationMicros: expiryMicros(),
    })

    onProgress?.('done', 100)

    const txHash = (result as any)?.txHash || (result as any)?.aptosTxHash || ''
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
    const contentHash = sha256Hex(data)

    return {
      blobName,
      aptosTxHash: txHash,
      contentHash,
      committedAt: Date.now(),
      explorerUrl: blobExplorerUrl(config.network, config.accountAddress),
      aptosExplorerUrl: aptosExplorerUrl(config.network, txHash),
      expiresAt,
      sizeBytes: data.byteLength,
    }
  } catch (err: any) {
    console.error('[shelby] upload error:', err)
    throw new ShelbyError(
      err?.message || 'Upload failed',
      err?.statusCode || err?.status
    )
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function uploadRecord(
  payload: RecordPayload,
  config: ShelbyConfig,
  onProgress?: UploadProgressCallback
): Promise<UploadReceipt> {
  const timestamp = Date.now()
  const blobName = `records/${payload.slug}/${timestamp}`
  const content = JSON.stringify({ ...payload, uploadedAt: timestamp })
  const data = new TextEncoder().encode(content)
  return uploadToShelby(blobName, data, config, onProgress)
}

export const uploadArticle = uploadRecord

export async function uploadDocument(
  doc: {
    name: string
    mimeType: string
    data: Uint8Array
    sourceDescription?: string
    articleSlug?: string
  },
  config: ShelbyConfig,
  onProgress?: UploadProgressCallback
): Promise<UploadReceipt> {
  const timestamp = Date.now()
  const safeName = doc.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const blobName = `documents/${doc.articleSlug || 'misc'}/${timestamp}-${safeName}`
  return uploadToShelby(blobName, doc.data, config, onProgress)
}

export async function getBlob(
  blobName: string,
  config: ShelbyConfig,
  range?: { start: number; end: number }
): Promise<BlobContent> {
  try {
    const { ShelbyNodeClient } = await import('@shelby-protocol/sdk/node')
    const { Network } = await import('@aptos-labs/ts-sdk')

    const sdkNetwork = config.network === 'shelbynet' ? Network.SHELBYNET : Network.TESTNET
    const shelbyClient = new ShelbyNodeClient({
      network: sdkNetwork,
      ...(config.apiKey ? { apiKey: config.apiKey } : {}),
    })

    const blob = await shelbyClient.download({
      account: config.accountAddress,
      blobName,
    })

    // Collect stream
    const chunks: Buffer[] = []
    for await (const chunk of blob.stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    const data = new Uint8Array(Buffer.concat(chunks))

    return {
      data,
      contentType: 'application/octet-stream',
      blobName,
      retrievedAt: Date.now(),
      totalBytes: data.byteLength,
    }
  } catch (err: any) {
    throw new ShelbyError(err?.message || 'Get blob failed')
  }
}

export const shelby = { uploadRecord, uploadArticle, uploadDocument, getBlob, configFromEnv: shelbyConfigFromEnv }
export default shelby
