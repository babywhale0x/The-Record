import { NextRequest, NextResponse } from 'next/server'
import {
  shelby,
  shelbyConfigFromEnv,
  ShelbyError,
  type ArticlePayload,
  type UploadReceipt,
} from '@/lib/shelby'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

  let article: ArticlePayload & {
  excerpt?: string
  contentType?: string
  tags?: string[]
  priceView?: number
  priceCite?: number
  priceLicense?: number
  publisherAddress?: string
}
  try {
    article = JSON.parse(articleJson)
  } catch {
    return NextResponse.json({ error: 'Invalid article JSON' }, { status: 400 })
  }

  let config
  try {
    config = shelbyConfigFromEnv()
  } catch (err) {
    console.error('[publish] Config error:', err)
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  // Upload to Shelby
  let articleReceipt: UploadReceipt
  try {
    articleReceipt = await shelby.uploadArticle(article, config, (stage, progress) => {
      console.log(`[publish] article ${stage}${progress != null ? ` ${progress}%` : ''}`)
    })
  } catch (err) {
    console.error('[publish] Article upload error:', err)
    const message = err instanceof ShelbyError ? err.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }

  // Upload source documents
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
      documentReceipts.push({
        originalName: file.name,
        blobName: '',
        aptosTxHash: '',
        contentHash: '',
        committedAt: Date.now(),
        explorerUrl: '',
        aptosExplorerUrl: '',
        expiresAt: '',
        // @ts-expect-error
        error: err instanceof ShelbyError ? err.message : 'Upload failed',
      })
    }
  }

  // Save to Supabase
  if (supabaseAdmin) {
    try {
      // Find or create publisher
      let publisherId: string | null = null
      if (article.publisherAddress) {
        const { data: pub } = await supabaseAdmin
          .from('publishers')
          .select('id')
          .eq('aptos_address', article.publisherAddress)
          .single()
        publisherId = pub?.id || null
      }

      // Insert record
      const expiresAt = articleReceipt.expiresAt
        ? new Date(articleReceipt.expiresAt).toISOString()
        : null

      const { data: record, error: recordError } = await supabaseAdmin
        .from('records')
        .insert({
          slug: article.slug,
          title: article.title,
          excerpt: article.excerpt || '',
          content_type: article.contentType || 'journalism',
          publisher_id: publisherId,
          publisher_name: article.publisherAddress?.slice(0, 10) || 'Anonymous',
          tags: article.tags || [],
          blob_name: articleReceipt.blobName,
          aptos_tx_hash: articleReceipt.aptosTxHash,
          content_hash: articleReceipt.contentHash,
          shelby_network: config.network || 'testnet',
          expires_at: expiresAt,
          price_view: article.priceView || 5,
          price_cite: article.priceCite || 19,
          price_license: article.priceLicense || 99,
          is_public: true,
        })
        .select('id')
        .single()

      if (recordError) {
        console.error('[publish] Supabase insert error:', recordError)
      }

      // Insert source documents
      if (record && documentReceipts.length > 0) {
        const docRows = documentReceipts
          .filter(d => d.blobName)
          .map(d => ({
            record_id: record.id,
            name: d.originalName,
            mime_type: 'application/octet-stream',
            blob_name: d.blobName,
            aptos_tx_hash: d.aptosTxHash,
            content_hash: d.contentHash,
            expires_at: d.expiresAt ? new Date(d.expiresAt).toISOString() : null,
          }))

        if (docRows.length > 0) {
          await supabaseAdmin.from('source_documents').insert(docRows)
        }
      }
    } catch (err) {
      console.error('[publish] Supabase save error:', err)
      // Non-fatal — Shelby upload succeeded, DB save failed
    }
  }

  return NextResponse.json({
    ok: true,
    article: articleReceipt,
    documents: documentReceipts,
  })
}
