import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getMockFeedRecords } from '@/lib/records'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const contentType = searchParams.get('type')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  let realRecords: any[] = []

  if (supabaseAdmin) {
    let query = supabaseAdmin
      .from('records')
      .select('id, slug, title, excerpt, content_type, publisher_name, tags, aptos_tx_hash, content_hash, price_view, created_at')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (contentType && contentType !== 'all') {
      query = query.eq('content_type', contentType)
    }

    const { data } = await query
    realRecords = data || []
  }

  // Pad with demo records if fewer than 6 real records exist
  let demoRecords: any[] = []
  if (realRecords.length < 6) {
    const allDemos = getMockFeedRecords()
    const filtered = contentType && contentType !== 'all'
      ? allDemos.filter((d) => d.content_type === contentType)
      : allDemos
    // Only include demos whose slugs don't clash with real records
    const realSlugs = new Set(realRecords.map((r) => r.slug))
    demoRecords = filtered.filter((d) => !realSlugs.has(d.slug))
  }

  // Real records first, then demos
  const records = [...realRecords, ...demoRecords]

  return NextResponse.json({ records })
}
