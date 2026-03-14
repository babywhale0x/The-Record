import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

/**
 * POST /api/publish
 *
 * Receives completed upload receipts from the browser (publisher's wallet
 * already signed and uploaded to Shelby directly). We just save to Supabase.
 *
 * Body: {
 *   article: { slug, title, excerpt, body, contentType, tags, priceView, priceCite, priceLicense, publisherAddress },
 *   articleReceipt: BrowserUploadResult,
 *   documentReceipts: (BrowserUploadResult & { originalName: string })[]
 * }
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { article, articleReceipt, documentReceipts = [] } = body

  if (!article?.title || !article?.slug) {
    return NextResponse.json({ error: 'Missing article title or slug' }, { status: 400 })
  }

  if (!articleReceipt?.blobName) {
    return NextResponse.json({ error: 'Missing article upload receipt' }, { status: 400 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    // Look up publisher ID from wallet address
    let publisherId: string | null = null
    if (article.publisherAddress) {
      const { data: pub } = await supabaseAdmin
        .from('publishers')
        .select('id')
        .eq('aptos_address', article.publisherAddress)
        .single()
      publisherId = pub?.id || null
    }

    const expiresAt = articleReceipt.expiresAt
      ? new Date(articleReceipt.expiresAt).toISOString()
      : null

    // Insert record
    const { data: record, error: recordError } = await supabaseAdmin
      .from('records')
      .insert({
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt || '',
        content_type: article.contentType || 'journalism',
        publisher_id: publisherId,
        publisher_name: article.publisherAddress?.slice(0, 10) || 'Anonymous',
        publisher_address: article.publisherAddress || null,
        tags: article.tags || [],
        blob_name: articleReceipt.blobName,
        aptos_tx_hash: articleReceipt.aptosTxHash,
        content_hash: articleReceipt.contentHash,
        shelby_network: 'testnet',
        expires_at: expiresAt,
        price_view: article.priceView || 5,
        price_cite: article.priceCite || 19,
        price_license: article.priceLicense || 99,
        is_public: true,
      })
      .select('id')
      .single()

    if (recordError) {
      console.error('[publish] Supabase record insert error:', recordError)
      return NextResponse.json({ error: 'Failed to save record' }, { status: 500 })
    }

    // Save document receipts
    if (record && documentReceipts.length > 0) {
      const docRows = documentReceipts
        .filter((d: any) => d.blobName)
        .map((d: any) => ({
          record_id: record.id,
          name: d.originalName || d.blobName,
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

    return NextResponse.json({ ok: true, slug: article.slug })
  } catch (err) {
    console.error('[publish] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
