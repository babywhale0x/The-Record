/**
 * GET /api/stream/[...path]
 * Fetches a blob from Shelby and streams it to the client.
 * Path format: /api/stream/{publisherAddress}/{blobName}
 * OR just:     /api/stream/{blobName} (uses platform address as fallback)
 */
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const pathParts = params.path
  if (!pathParts?.length) {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 })
  }

  const shelbyRpcUrl = 'https://api.testnet.shelby.xyz/shelby'
  const apiKey = process.env.SHELBY_API_KEY || ''

  // Path can be:
  // - [address, blobName] → direct address + blob
  // - [blobName] → use platform address
  // - [address, ...rest] → address + nested blob path
  let accountAddress: string
  let blobName: string

  if (pathParts[0].startsWith('0x') && pathParts.length > 1) {
    accountAddress = pathParts[0]
    blobName = pathParts.slice(1).join('/')
  } else {
    accountAddress = process.env.APTOS_ACCOUNT_ADDRESS || ''
    blobName = pathParts.join('/')
  }

  if (!accountAddress) {
    return NextResponse.json({ error: 'No account address' }, { status: 500 })
  }

  const url = `${shelbyRpcUrl}/v1/blobs/${accountAddress}/${encodeURIComponent(blobName)}`

  try {
    const headers: Record<string, string> = {}
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

    const rangeHeader = req.headers.get('range')
    if (rangeHeader) headers['Range'] = rangeHeader

    const res = await fetch(url, { headers })

    if (!res.ok) {
      console.error('[stream] Shelby fetch failed:', res.status, url)
      return NextResponse.json(
        { error: `Shelby fetch failed: ${res.status}` },
        { status: res.status === 404 ? 404 : 502 }
      )
    }

    const data = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') || 'application/octet-stream'

    return new NextResponse(data, {
      status: rangeHeader ? 206 : 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=300',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    })
  } catch (err: any) {
    console.error('[stream] Error:', err)
    return NextResponse.json({ error: err?.message || 'Stream failed' }, { status: 502 })
  }
}
