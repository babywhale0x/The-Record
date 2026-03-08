/**
 * GET /api/balance
 *
 * Returns the current APT and ShelbyUSD balance for the configured account.
 * Used by the dashboard to show the journalist's wallet status.
 *
 * Auth: Bearer token (same session auth as /api/publish)
 */

import { NextRequest, NextResponse } from 'next/server'
import { shelby, shelbyConfigFromEnv, ShelbyError } from '@/lib/shelby'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let config
  try {
    config = shelbyConfigFromEnv()
  } catch {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  try {
    const balance = await shelby.getAccountBalance(config)
    return NextResponse.json(balance)
  } catch (err) {
    console.error('[balance] Error:', err)
    const message = err instanceof ShelbyError ? err.message : 'Failed to fetch balance'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
