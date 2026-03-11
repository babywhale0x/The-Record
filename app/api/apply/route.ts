/**
 * POST /api/apply
 *
 * Saves a creator application to Supabase.
 * Called from the /publish 3-step application form.
 *
 * Body matches the form state from app/publish/page.tsx
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const required = ['name', 'email', 'creatorType', 'contentTypes', 'bio', 'contentPlan']
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 })
    }
  }

  // Basic email validation
  if (typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
      .from('creator_applications')
      .insert({
        name: body.name,
        email: (body.email as string).toLowerCase().trim(),
        twitter_handle: body.handle || null,
        country: body.country || null,
        creator_type: body.creatorType,
        content_types: body.contentTypes,
        sample_url_1: body.sampleUrl1 || null,
        sample_url_2: body.sampleUrl2 || null,
        bio: body.bio,
        content_plan: body.contentPlan,
        wallet_ready: body.walletReady || null,
        aptos_address: body.aptosAddress || null,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      })

    if (error) {
      // Duplicate email
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'An application from this email already exists.' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[apply]', err)
    return NextResponse.json({ error: 'Failed to save application' }, { status: 500 })
  }
}
