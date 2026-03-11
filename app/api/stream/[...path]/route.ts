/**
 * GET /api/stream/[...path]
 *
 * Proxies a Shelby blob read with byte-range support.
 * Used by the locked document viewer to serve blurred previews
 * without exposing the full blob URL or requiring client-side keys.
 *
 * Query params:
 *   ?preview=1   — serve only first 32KB (for locked preview)
 *   ?range=...   — pass a custom byte range (e.g. bytes=0-1048575)
 *
 * The blob name is everything after /api/stream/ — so:
 *   /api/stream/0x3f9a.../records/lazarus-bridge/1234567890
 *   → reads blob "0x3f9a.../records/lazarus-bridge/1234567890"
 *
 * Security: only blobs that exist in the DB records table are served.
 * TODO: add Supabase lookup to validate blobName before serving.
 */

import { NextRequest, NextResponse } from 'next/server'
import { shelbyConfigFromEnv, ShelbyError, getBlob } from '@/lib/shelby'

export const runtime = 'nodejs'

const PREVIEW_BYTES = 32 * 1024 // 32 KB — enough for a document preview

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const blobName = params.path.join('/')

  if (!blobName) {
    return NextResponse.json({ error: 'Missing blob name' }, { status: 400 })
  }

  // Basic safety — only allow alphanumeric, slashes, dots, dashes, underscores
  if (!/^[a-zA-Z0-9/_.\-]+$/.test(blobName)) {
    return NextResponse.json({ error: 'Invalid blob name' }, { status: 400 })
  }

  let config
  try {
    config = shelbyConfigFromEnv()
  } catch (err) {
    console.error('[stream] Config error:', err)
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const url = new URL(req.url)
  const isPreview = url.searchParams.get('preview') === '1'
  const customRange = url.searchParams.get('range')

  // Determine byte range to request
  let rangeHeader: string | undefined
  let rangeObj: { start: number; end: number } | undefined
  if (isPreview) {
    rangeHeader = `bytes=0-${PREVIEW_BYTES - 1}`
    rangeObj = { start: 0, end: PREVIEW_BYTES - 1 }
  } else if (customRange) {
    if (!/^bytes=\d+-\d*$/.test(customRange)) {
      return NextResponse.json({ error: 'Invalid range format' }, { status: 400 })
    }
    rangeHeader = customRange
    const [, s, e] = customRange.match(/bytes=(\d+)-(\d*)/) ?? []
    rangeObj = { start: parseInt(s), end: e ? parseInt(e) : Number.MAX_SAFE_INTEGER }
  }

  try {
    const blob = await getBlob(blobName, config, rangeObj)

    const headers: Record<string, string> = {
      'Content-Type': blob.contentType,
      'Cache-Control': 'private, max-age=300',
      'X-Blob-Name': blobName,
    }

    if (blob.totalBytes) {
      headers['X-Total-Size'] = String(blob.totalBytes)
    }
    if (rangeHeader) {
      headers['Content-Range'] = `${rangeHeader.replace('=', ' ')}/${blob.totalBytes ?? '*'}`
    }

    return new NextResponse(Buffer.from(blob.data), {
      status: rangeObj ? 206 : 200,
      headers,
    })
  } catch (err) {
    const status = err instanceof ShelbyError ? (err.statusCode ?? 502) : 502
    const message = err instanceof ShelbyError ? err.message : 'Stream failed'
    console.error('[stream] Error:', err)
    return NextResponse.json({ error: message }, { status })
  }
}
