/**
 * lib/shelby-browser.ts
 * Browser-side Shelby upload using the publisher's connected wallet.
 * Per docs: https://docs.shelby.xyz/sdks/typescript/browser/guides/upload
 * 
 * Three-step flow:
 * 1. Encode file → generate commitments
 * 2. Register blob on-chain → publisher signs tx via wallet adapter
 * 3. RPC upload → send file bytes to Shelby storage
 */

export interface BrowserUploadResult {
  blobName: string
  aptosTxHash: string
  contentHash: string
  committedAt: number
  expiresAt: string
}

export interface BrowserUploadProgress {
  stage: 'encoding' | 'registering' | 'uploading' | 'done' | 'error'
  message: string
  progress?: number
}

type ProgressCallback = (p: BrowserUploadProgress) => void

// SHA-256 in browser
async function sha256Hex(data: Uint8Array): Promise<string> {
  const hashBuf = await crypto.subtle.digest('SHA-256', data.buffer as ArrayBuffer)
  return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function uploadFileFromBrowser(
  file: File,
  accountAddress: string,
  signAndSubmitTransaction: (tx: any) => Promise<{ hash: string }>,
  onProgress?: ProgressCallback
): Promise<BrowserUploadResult> {
  const { Network, Aptos, AptosConfig, AccountAddress } = await import('@aptos-labs/ts-sdk')
  const {
    createDefaultErasureCodingProvider,
    generateCommitments,
    expectedTotalChunksets,
    ShelbyBlobClient,
    ShelbyClient,
  } = await import('@shelby-protocol/sdk/browser')

  const aptosAccountAddress = AccountAddress.from(accountAddress)

  // shelbynet is Shelby's dev network - isolated from Aptos testnet
  const network = Network.CUSTOM
  const shelbyRpcUrl = 'https://api.shelbynet.shelby.xyz/shelby'
  const aptosNodeUrl = 'https://api.shelbynet.shelby.xyz/v1'
  const apiKey = process.env.NEXT_PUBLIC_APTOS_API_KEY

  // ── Step 1: Encode ─────────────────────────────────────────────────────────
  onProgress?.({ stage: 'encoding', message: `Encoding ${file.name}…` })
  const data = Buffer.from(await file.arrayBuffer())
  const provider = await createDefaultErasureCodingProvider()
  const commitments = await generateCommitments(provider, data)

  // ── Step 2: Register on-chain ──────────────────────────────────────────────
  onProgress?.({ stage: 'registering', message: 'Registering on Aptos…' })
  const expirationMicros = (Date.now() + 30 * 24 * 60 * 60 * 1000) * 1000

  const payload = (ShelbyBlobClient as any).createRegisterBlobPayload({
    account: aptosAccountAddress,
    blobName: file.name,
    blobMerkleRoot: commitments.blob_merkle_root,
    numChunksets: expectedTotalChunksets(commitments.raw_data_size),
    expirationMicros,
    blobSize: commitments.raw_data_size,
    encoding: 0, // default RS encoding
  })

  const submitted = await signAndSubmitTransaction({ data: payload })

  // Wait for confirmation
  const aptosClient = new Aptos(new AptosConfig({
    network,
    fullnode: aptosNodeUrl,
    ...(apiKey ? { clientConfig: { HEADERS: { Authorization: `Bearer ${apiKey}` } } } : {}),
  }))
  await aptosClient.waitForTransaction({ transactionHash: submitted.hash })

  // ── Step 3: RPC upload ─────────────────────────────────────────────────────
  onProgress?.({ stage: 'uploading', message: `Uploading ${file.name} to Shelby…`, progress: 0 })

  const shelbyClient = new (ShelbyClient as any)({
    network,
    shelbyRpcUrl,
    nodeUrl: aptosNodeUrl,
    ...(apiKey ? { apiKey } : {}),
  })

  await shelbyClient.rpc.putBlob({
    account: aptosAccountAddress,
    blobName: file.name,
    blobData: new Uint8Array(data),
  })

  const contentHash = await sha256Hex(new Uint8Array(data))
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  onProgress?.({ stage: 'done', message: `${file.name} uploaded`, progress: 100 })

  return {
    blobName: file.name,
    aptosTxHash: submitted.hash,
    contentHash,
    committedAt: Date.now(),
    expiresAt,
  }
}
