import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  // Get publisher address from query param
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')

  let query = supabaseAdmin
    .from('records')
    .select('id, slug, title, content_type, created_at, view_count, license_count, blob_name, aptos_tx_hash, is_public, featured')
    .order('published_at', { ascending: false })
    .limit(50)

  if (address) {
    // Filter by publisher if address provided
    const { data: publisher } = await supabaseAdmin
      .from('publishers')
      .select('id')
      .eq('aptos_address', address)
      .single()

    if (publisher) {
      query = query.eq('publisher_id', publisher.id)
    }
  }

  const { data: records, error } = await query

  if (error) {
    console.error('[dashboard/records]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ records: records || [] })
}
