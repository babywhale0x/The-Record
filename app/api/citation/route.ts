/**
 * POST /api/citation
 *
 * Issues a verifiable citation package for the Cite license tier.
 *
 * When a reader purchases a Cite license, we:
 *   1. Generate a unique citationId
 *   2. Build a CitationPackage JSON with the record's on-chain proof
 *   3. Upload the citation package itself to Shelby (so it's also permanent)
 *   4. Return the citationId + receipt for PDF generation
 *
 * The citation PDF is generated client-side from the returned data.
 * The Shelby blob name of the citation proves it was issued at a specific time.
 *
 * Body: {
 *   recordSlug: string
 *   recordTitle: string
 *   citerAddress: string        // buyer's wallet address
 *   recordBlobName: string      // from original upload receipt
 *   recordAptosTxHash: string
 *   recordContentHash: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  shelbyConfigFromEnv,
  issueCitation,
  ShelbyError,
} from '@/lib/shelby'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let body: {
    recordSlug?: string
    recordTitle?: string
    citerAddress?: string
    recordBlobName?: string
    recordAptosTxHash?: string
    recordContentHash?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    recordSlug, recordTitle, citerAddress,
    recordBlobName, recordAptosTxHash, recordContentHash,
  } = body

  if (!recordSlug || !recordTitle || !citerAddress || !recordBlobName || !recordAptosTxHash || !recordContentHash) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Basic wallet address validation
  if (!/^0x[0-9a-fA-F]{1,64}$/.test(citerAddress)) {
    return NextResponse.json({ error: 'Invalid citerAddress format' }, { status: 400 })
  }

  let config
  try {
    config = shelbyConfigFromEnv()
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }

  try {
    const { receipt, citationId } = await issueCitation(
      {
        recordSlug,
        recordTitle,
        citerAddress,
        recordReceipt: {
          blobName: recordBlobName,
          aptosTxHash: recordAptosTxHash,
          contentHash: recordContentHash,
        },
      },
      config
    )

    return NextResponse.json({
      ok: true,
      citationId,
      receipt,
      // Data the client needs to render the citation PDF
      pdf: {
        citationId,
        recordTitle,
        recordSlug,
        citerAddress,
        issuedAt: new Date().toISOString(),
        aptosExplorerUrl: receipt.aptosExplorerUrl,
        shelbyBlobName: receipt.blobName,
        contentHash: receipt.contentHash,
        // QR code data — link to verify the citation on-chain
        qrData: `https://therecord.xyz/verify/citation/${citationId}`,
      },
    })
  } catch (err) {
    const status = err instanceof ShelbyError ? (err.statusCode ?? 502) : 500
    const message = err instanceof ShelbyError ? err.message : 'Citation issuance failed'
    console.error('[citation]', err)
    return NextResponse.json({ error: message }, { status })
  }
}
