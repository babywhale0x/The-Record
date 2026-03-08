/**
 * POST /api/publish
 *
 * Accepts a multipart/form-data request containing:
 *   - article: JSON string (ArticlePayload)
 *   - documents: zero or more file attachments
 *
 * Uploads everything to Shelby and returns an array of UploadReceipts.
 *
 * This is a server-side route — env vars with private keys never leave the server.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  shelby,
  shelbyConfigFromEnv,
  ShelbyError,
  type ArticlePayload,
  type UploadReceipt,
} from '@/lib/shelby'

export const runtime = 'nodejs' // Required — Web Crypto + fetch needed

export async function POST(req: NextRequest) {
  // ── Auth guard ────────────────────────────────────────────────────────────
  // TODO: Replace with your real session/wallet-sig auth check
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse request ─────────────────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const articleJson = formData.get('article')
  if (!articleJson || typeof articleJson !== 'string') {
    return NextResponse.json({ error: 'Missing article field' }, { status: 400 })
  }

  let article: ArticlePayload
  try {
    article = JSON.parse(articleJson)
  } catch {
    return NextResponse.json({ error: 'Invalid article JSON' }, { status: 400 })
  }

  // ── Shelby config ─────────────────────────────────────────────────────────
  let config
  try {
    config = shelbyConfigFromEnv()
  } catch (err) {
    console.error('[publish] Config error:', err)
    return NextResponse.json(
      { error: 'Server configuration error. Check environment variables.' },
      { status: 500 }
    )
  }

  // ── Upload article ────────────────────────────────────────────────────────
  let articleReceipt: UploadReceipt
  try {
    articleReceipt = await shelby.uploadArticle(article, config, (stage, progress) => {
      // In production, stream these via Server-Sent Events for real-time UI updates
      console.log(`[publish] article ${stage}${progress != null ? ` ${progress}%` : ''}`)
    })
  } catch (err) {
    console.error('[publish] Article upload error:', err)
    const message = err instanceof ShelbyError ? err.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }

  // ── Upload documents ──────────────────────────────────────────────────────
  const documentReceipts: Array<UploadReceipt & { originalName: string }> = []
  const files = formData.getAll('documents') as File[]

  for (const file of files) {
    try {
      const arrayBuf = await file.arrayBuffer()
      const data = new Uint8Array(arrayBuf)

      const receipt = await shelby.uploadDocument(
        {
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          data,
          sourceDescription: `Uploaded with article: ${article.title}`,
          articleSlug: article.slug,
        },
        config,
        (stage, progress) => {
          console.log(`[publish] doc "${file.name}" ${stage}${progress != null ? ` ${progress}%` : ''}`)
        }
      )

      documentReceipts.push({ ...receipt, originalName: file.name })
    } catch (err) {
      console.error(`[publish] Document upload error (${file.name}):`, err)
      // Non-fatal: return partial results with error flag per document
      documentReceipts.push({
        originalName: file.name,
        blobName: '',
        aptosTxHash: '',
        contentHash: '',
        committedAt: Date.now(),
        explorerUrl: '',
        aptosExplorerUrl: '',
        expiresAt: '',
        // @ts-expect-error — error flag
        error: err instanceof ShelbyError ? err.message : 'Upload failed',
      })
    }
  }

  // ── Return receipts ───────────────────────────────────────────────────────
  return NextResponse.json({
    ok: true,
    article: articleReceipt,
    documents: documentReceipts,
  })
}
