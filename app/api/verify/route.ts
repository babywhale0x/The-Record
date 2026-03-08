/**
 * POST /api/verify
 *
 * Verifies that a Shelby blob's current content matches its original
 * on-chain commitment. Used by the source documents "Verify" button
 * in the article reader.
 *
 * Body: { blobName: string, contentHash: string, aptosTxHash: string }
 * Response: VerificationResult
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  shelby,
  shelbyConfigFromEnv,
  ShelbyError,
  type VerificationResult,
} from '@/lib/shelby'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let body: { blobName?: string; contentHash?: string; aptosTxHash?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { blobName, contentHash, aptosTxHash } = body

  if (!blobName || !contentHash || !aptosTxHash) {
    return NextResponse.json(
      { error: 'Missing required fields: blobName, contentHash, aptosTxHash' },
      { status: 400 }
    )
  }

  let config
  try {
    config = shelbyConfigFromEnv()
  } catch {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  let result: VerificationResult
  try {
    result = await shelby.verifyDocument({ blobName, contentHash, aptosTxHash }, config)
  } catch (err) {
    console.error('[verify] Error:', err)
    const message = err instanceof ShelbyError ? err.message : 'Verification failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }

  return NextResponse.json(result)
}
