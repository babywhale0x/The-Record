import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '../_auth'
import { supabaseAdmin } from '@/lib/supabase'
export const runtime = 'nodejs'
export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const { data, error } = await supabaseAdmin
    .from('records').select('*').order('published_at', { ascending: false }).limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ records: data || [] })
}
