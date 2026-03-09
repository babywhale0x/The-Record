/**
 * POST /api/renew
 *
 * Renew Shelby blobs that are approaching expiry.
 * Call this from a Vercel Cron Job (see vercel.json).
 *
 * It reads all records from Supabase where expires_at < NOW() + 30 days,
 * re-uploads each blob with a fresh TTL, and updates the DB row.
 *
 * Protected by CRON_SECRET env var — Vercel sets this automatically
 * when you configure a cron job.
 *
 * Manual trigger (dev):
 *   curl -X POST https://your-app.vercel.app/api/renew \
 *     -H "Authorization: Bearer $CRON_SECRET"
 */

import { NextRequest, NextResponse } from 'next/server'
import { shelbyConfigFromEnv, renewBlob, ShelbyError } from '@/lib/shelby'

export const runtime = 'nodejs'

/** Renew blobs expiring within this many days */
const RENEW_THRESHOLD_DAYS = 30
/** New TTL on renewal */
const RENEWAL_TTL_DAYS = 365
/** Max blobs to renew per run (rate-limit protection) */
const MAX_PER_RUN = 50

export async function POST(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('Authorization')

  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Shelby config ─────────────────────────────────────────────────────────
  let config
  try {
    config = shelbyConfigFromEnv()
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }

  // ── Fetch expiring blobs from Supabase ───────────────────────────────────
  // Lazy import so this route still works even without Supabase configured
  let expiringBlobs: Array<{ id: string; blob_name: string; content_hash: string }> = []

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const thresholdDate = new Date(
      Date.now() + RENEW_THRESHOLD_DAYS * 86400 * 1000
    ).toISOString()

    const { data, error } = await supabase
      .from('articles')
      .select('id, blob_name, content_hash')
      .lt('expires_at', thresholdDate)
      .not('blob_name', 'is', null)
      .limit(MAX_PER_RUN)

    if (error) throw error
    expiringBlobs = data ?? []
  } catch (err) {
    console.warn('[renew] Supabase unavailable, using empty list:', err)
    // Still return success — no blobs to renew is fine
    return NextResponse.json({
      ok: true,
      renewed: 0,
      failed: 0,
      message: 'No Supabase connection — no blobs renewed',
    })
  }

  if (expiringBlobs.length === 0) {
    return NextResponse.json({ ok: true, renewed: 0, failed: 0, message: 'No blobs need renewal' })
  }

  // ── Renew each blob ────────────────────────────────────────────────────────
  const results = { renewed: 0, failed: 0, errors: [] as string[] }

  for (const row of expiringBlobs) {
    try {
      const receipt = await renewBlob(row.blob_name, config, RENEWAL_TTL_DAYS)

      // Update Supabase with new blob name + expiry
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      await supabase
        .from('articles')
        .update({
          blob_name: receipt.blobName,
          aptos_tx_hash: receipt.aptosTxHash,
          expires_at: receipt.expiresAt,
          renewed_at: new Date().toISOString(),
        })
        .eq('id', row.id)

      results.renewed++
      console.log(`[renew] ✓ ${row.blob_name} → ${receipt.blobName}`)
    } catch (err) {
      results.failed++
      const msg = err instanceof ShelbyError ? err.message : String(err)
      results.errors.push(`${row.blob_name}: ${msg}`)
      console.error(`[renew] ✗ ${row.blob_name}:`, err)
    }
  }

  return NextResponse.json({
    ok: true,
    ...results,
    checkedAt: new Date().toISOString(),
  })
}

// Also support GET so Vercel cron (which sends GET) works out of the box
export async function GET(req: NextRequest) {
  return POST(req)
}
