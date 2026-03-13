import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  // First try with body column
  let record: any = null
  let error: any = null

  const result1 = await supabaseAdmin
    .from('records')
    .select(`
      id, slug, title, excerpt, body, content_type,
      publisher_name, publisher_id, tags,
      blob_name, aptos_tx_hash, content_hash, shelby_network,
      price_view, price_cite, price_license, created_at,
      source_documents (id, name, content_hash)
    `)
    .eq('slug', params.slug)
    .single()

  if (result1.error) {
    // Retry without body column in case it doesn't exist
    const result2 = await supabaseAdmin
      .from('records')
      .select(`
        id, slug, title, excerpt, content_type,
        publisher_name, publisher_id, tags,
        blob_name, aptos_tx_hash, content_hash, shelby_network,
        price_view, price_cite, price_license, created_at,
        source_documents (id, name, content_hash)
      `)
      .eq('slug', params.slug)
      .single()

    record = result2.data
    error = result2.error
  } else {
    record = result1.data
  }

  if (error || !record) {
    console.error('[api/records] error:', error)
    return NextResponse.json({ error: 'Record not found', detail: error?.message }, { status: 404 })
  }

  return NextResponse.json({ record })
}
