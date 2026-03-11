import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '../_auth'
import { supabaseAdmin } from '@/lib/supabase'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })
  const { applicationId } = await req.json().catch(() => ({}))
  if (!applicationId) return NextResponse.json({ error: 'applicationId required' }, { status: 400 })
  await supabaseAdmin
    .from('creator_applications')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
    .eq('id', applicationId)
  return NextResponse.json({ ok: true })
}
