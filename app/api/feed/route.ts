import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const contentType = searchParams.get('type')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  if (!supabaseAdmin) {
    return NextResponse.json({ records: [] })
  }

  let query = supabaseAdmin
    .from('records')
    .select('id, slug, title, excerpt, content_type, publisher_name, tags, aptos_tx_hash, content_hash, price_view, created_at')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (contentType && contentType !== 'all') {
    query = query.eq('content_type', contentType)
  }

  const { data: records, error } = await query

  if (error) {
    console.error('[feed] error:', error)
    return NextResponse.json({ records: [] })
  }

  return NextResponse.json({ records: records || [] })
}
