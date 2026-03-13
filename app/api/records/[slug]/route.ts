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

  const { data: record, error } = await supabaseAdmin
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

  if (error || !record) {
    return NextResponse.json({ error: 'Record not found' }, { status: 404 })
  }

  return NextResponse.json({ record })
}
