import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

// Returns the publisher status for a given Aptos wallet address:
//   approved  — wallet is in the publishers table
//   pending   — application submitted but not yet approved
//   none      — no application found

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')

  if (!address) {
    return NextResponse.json({ status: 'none' })
  }

  if (!supabaseAdmin) {
    // If DB not configured, allow access (dev mode)
    return NextResponse.json({ status: 'approved' })
  }

  // Check publishers table first (approved)
  const { data: publisher } = await supabaseAdmin
    .from('publishers')
    .select('id')
    .eq('aptos_address', address)
    .single()

  if (publisher) {
    return NextResponse.json({ status: 'approved' })
  }

  // Check if they have a pending application (matched by wallet not email,
  // so also check if any approved application has this wallet set)
  const { data: application } = await supabaseAdmin
    .from('creator_applications')
    .select('id, status')
    .eq('aptos_address', address)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .single()

  if (application) {
    return NextResponse.json({ status: application.status === 'approved' ? 'approved' : 'pending' })
  }

  return NextResponse.json({ status: 'none' })
}
