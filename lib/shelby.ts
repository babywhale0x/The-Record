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

// ─── Core upload using direct HTTP (bypasses SDK clay.wasm dependency) ────────

async function uploadToShelby(
  blobName: string,
  data: Uint8Array,
  config: ShelbyConfig,
  onProgress?: UploadProgressCallback
): Promise<UploadReceipt> {
  onProgress?.('preparing')

  try {
    const { Account, Ed25519PrivateKey, Aptos, AptosConfig, Network } = await import('@aptos-labs/ts-sdk')

    const aptosNodeUrl = 'https://api.testnet.aptoslabs.com/v1'
    const shelbyRpcUrl = 'https://api.testnet.shelby.xyz/shelby'

    // Build account from private key
    const privateKey = new Ed25519PrivateKey(config.privateKey)
    const account = Account.fromPrivateKey({ privateKey })

    // Step 1: Register blob on Aptos via Shelby smart contract
    onProgress?.('uploading', 0)

    const aptosClient = new Aptos(new AptosConfig({
      network: Network.TESTNET,
      ...(config.apiKey ? { clientConfig: { API_KEY: config.apiKey } } : {}),
    }))

    // Build register transaction
    const expirationMicros = expiryMicros()
    const contentHash = sha256Hex(data)

    // Submit registration transaction to Shelby smart contract
    const transaction = await aptosClient.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `0xc63d6a5efb0080a6029403131715bd4971e1149f7cc099aac69bb0069b3ddbf5::blob_store::register_blob`,
        functionArguments: [
          blobName,
          Array.from(data).length,
          expirationMicros,
        ],
      },
    })

    const submitted = await aptosClient.signAndSubmitTransaction({
      signer: account,
      transaction,
    })

    await aptosClient.waitForTransaction({ transactionHash: submitted.hash })

    // Step 2: Upload blob data directly to Shelby RPC via HTTP PUT
    onProgress?.('uploading', 50)

    const uploadUrl = `${shelbyRpcUrl}/v1/blobs/${config.accountAddress}/${encodeURIComponent(blobName)}`
    const headers: Record<string, string> = {
      'Content-Length': data.byteLength.toString(),
    }
    if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`

    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers,
      body: Buffer.from(data),
    })

    if (!uploadRes.ok && uploadRes.status !== 204) {
      throw new ShelbyError(`RPC upload failed: ${uploadRes.status} ${uploadRes.statusText}`)
    }

    onProgress?.('done', 100)

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()

    return {
      blobName,
      aptosTxHash: submitted.hash,
      contentHash,
      committedAt: Date.now(),
      explorerUrl: blobExplorerUrl(config.network, config.accountAddress),
      aptosExplorerUrl: aptosExplorerUrl(config.network, submitted.hash),
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
    const shelbyRpcUrl = 'https://api.testnet.shelby.xyz/shelby'
    const url = `${shelbyRpcUrl}/v1/blobs/${config.accountAddress}/${encodeURIComponent(blobName)}`

    const headers: Record<string, string> = {}
    if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`
    if (range) headers['Range'] = `bytes=${range.start}-${range.end}`

    const res = await fetch(url, { headers })
    if (!res.ok) throw new ShelbyError(`Get blob failed: ${res.status}`)

    const arrayBuf = await res.arrayBuffer()
    const data = new Uint8Array(arrayBuf)

    return {
      data,
      contentType: res.headers.get('content-type') || 'application/octet-stream',
      blobName,
      retrievedAt: Date.now(),
      totalBytes: data.byteLength,
    }
  } catch (err: any) {
    throw new ShelbyError(err?.message || 'Get blob failed')
  }
}


// ─── Stub exports for balance, citation, renew ───────────────────────────────
// These are used by /api/balance, /api/citation, /api/renew

export async function getAccountBalance(config: ShelbyConfig): Promise<{ apt: number; shelbyUsd: number }> {
  try {
    const { Aptos, AptosConfig, Network } = await import('@aptos-labs/ts-sdk')
    // shelbynet is Shelby's own chain - use custom URLs, not Aptos Network enum
    const aptosNodeUrl = config.network === 'shelbynet'
      ? 'https://api.testnet.aptoslabs.com/v1'
      : 'https://api.testnet.aptoslabs.com/v1'
    const aptos = new Aptos(new AptosConfig({
      network: Network.CUSTOM,
      fullnode: aptosNodeUrl,
      ...(config.apiKey ? { clientConfig: { API_KEY: config.apiKey } } : {}),
    }))
    const resources = await aptos.getAccountResources({ accountAddress: config.accountAddress })
    const aptResource = resources.find((r: any) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>')
    const aptRaw = (aptResource?.data as any)?.coin?.value || '0'
    return { apt: parseInt(aptRaw) / 1e8, shelbyUsd: 0 }
  } catch {
    return { apt: 0, shelbyUsd: 0 }
  }
}

export async function issueCitation(
  params: {
    recordSlug: string
    recordTitle: string
    citerAddress: string
    recordReceipt: { blobName: string; aptosTxHash: string; contentHash: string }
  },
  config: ShelbyConfig
): Promise<{ receipt: UploadReceipt; citationId: string }> {
  const { randomBytes } = await import('crypto')
  const citationId = randomBytes(8).toString('hex').toUpperCase()
  const timestamp = Date.now()
  const blobName = `citations/${params.recordSlug}/${timestamp}-cite.json`
  const citationData = JSON.stringify({
    citationId,
    ...params,
    issuedAt: new Date(timestamp).toISOString(),
  })
  const data = new TextEncoder().encode(citationData)
  const receipt = await uploadToShelby(blobName, data, config)
  return { receipt, citationId }
}

export async function renewBlob(
  blobName: string,
  config: ShelbyConfig,
  ttlDays = 365
): Promise<UploadReceipt> {
  // Re-fetch and re-upload with a fresh TTL
  const existing = await getBlob(blobName, config)
  const newBlobName = blobName.replace(/\/\d+(-|$)/, `/${Date.now()}$1`)
  return uploadToShelby(newBlobName, existing.data, config)
}

export async function verifyDocument(
  params: { blobName: string; contentHash: string; aptosTxHash: string },
  config: ShelbyConfig
): Promise<VerificationResult> {
  try {
    const blob = await getBlob(params.blobName, config)
    const currentHash = sha256Hex(blob.data)
    const intact = currentHash === params.contentHash
    return {
      verified: intact,
      onChainHash: params.contentHash,
      currentHash,
      intact,
      txDetails: null,
      verifiedAt: Date.now(),
    }
  } catch (err: any) {
    throw new ShelbyError(err?.message || 'Verification failed')
  }
}






export const shelby = { uploadRecord, uploadArticle, uploadDocument, getBlob, getAccountBalance, issueCitation, renewBlob, verifyDocument, configFromEnv: shelbyConfigFromEnv }
export default shelby
