import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '../_auth'
import { supabaseAdmin } from '@/lib/supabase'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!supabaseAdmin) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const { applicationId, aptosAddress, handle } = await req.json().catch(() => ({}))

  if (!applicationId || !aptosAddress || !handle) {
    return NextResponse.json({ error: 'applicationId, aptosAddress, and handle are required' }, { status: 400 })
  }

  // Get application
  const { data: app, error: appErr } = await supabaseAdmin
    .from('creator_applications')
    .select('*')
    .eq('id', applicationId)
    .single()

  if (appErr || !app) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  // Create publisher — this is the whitelist entry
  const { error: pubErr } = await supabaseAdmin
    .from('publishers')
    .insert({
      application_id: applicationId,
      name: app.name,
      handle: handle.toLowerCase().replace(/\s+/g, '-'),
      aptos_address: aptosAddress,
      verified: false,
      content_types: app.content_types,
      bio: app.bio,
    })

  if (pubErr) {
    // Handle duplicate handle
    if (pubErr.code === '23505') {
      return NextResponse.json({ error: 'A publisher with this handle already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: pubErr.message }, { status: 500 })
  }

  // Update application status to approved + store wallet
  await supabaseAdmin
    .from('creator_applications')
    .update({
      status: 'approved',
      aptos_address: aptosAddress,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', applicationId)

  return NextResponse.json({ ok: true, aptosAddress, handle })
}
