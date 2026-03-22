import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createHash, randomUUID } from 'crypto'

export const runtime = 'nodejs'

function formatAPA(record: any, citationId: string, date: string): string {
  return `${record.publisher_name}. (${new Date(record.created_at).getFullYear()}). *${record.title}*. The Record. https://therecord.vercel.app/records/${record.slug} [Citation ID: ${citationId}]`
}

function formatMLA(record: any, citationId: string): string {
  const d = new Date(record.created_at)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${record.publisher_name}. "${record.title}." *The Record*, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, therecord.vercel.app/records/${record.slug}. Citation ID: ${citationId}.`
}

function formatChicago(record: any, citationId: string): string {
  const d = new Date(record.created_at)
  return `${record.publisher_name}. "${record.title}." The Record. ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. https://therecord.vercel.app/records/${record.slug}. Citation ID: ${citationId}.`
}

function formatBluebook(record: any, citationId: string): string {
  const d = new Date(record.created_at)
  return `${record.publisher_name}, *${record.title}*, The Record (${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}), https://therecord.vercel.app/records/${record.slug} (Citation ID: ${citationId}).`
}

export async function POST(req: NextRequest) {
  try {
    const { slug, licenseeAddress, txHash, tier } = await req.json()

    if (!slug || !licenseeAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Fetch record from Supabase
    const { data: record, error } = await supabaseAdmin
      .from('records')
      .select('id, slug, title, excerpt, content_type, publisher_name, publisher_address, content_hash, aptos_tx_hash, blob_name, created_at, tags')
      .eq('slug', slug)
      .single()

    if (error || !record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    // Generate unique citation ID
    const citationId = `CR-${createHash('sha256')
      .update(`${slug}-${licenseeAddress}-${Date.now()}`)
      .digest('hex')
      .slice(0, 12)
      .toUpperCase()}`

    const issuedAt = new Date().toISOString()
    const verificationUrl = `https://therecord.vercel.app/verify/${citationId}`
    const explorerUrl = `https://explorer.aptoslabs.com/txn/${txHash}?network=testnet`

    const citation = {
      citationId,
      issuedAt,
      tier: tier || 'cite',

      // Record details
      record: {
        slug: record.slug,
        title: record.title,
        excerpt: record.excerpt,
        contentType: record.content_type,
        publisherName: record.publisher_name,
        publisherAddress: record.publisher_address,
        publishedAt: record.created_at,
        tags: record.tags || [],
      },

      // Cryptographic proof
      proof: {
        contentHash: record.content_hash || '',
        publishTxHash: record.aptos_tx_hash || '',
        licenseTxHash: txHash || '',
        shelbyBlobName: record.blob_name || '',
        explorerUrl,
        verificationUrl,
      },

      // Licensee
      licensee: {
        address: licenseeAddress,
        licensedAt: issuedAt,
      },

      // Formatted citations
      formats: {
        apa: formatAPA(record, citationId, issuedAt),
        mla: formatMLA(record, citationId),
        chicago: formatChicago(record, citationId),
        bluebook: formatBluebook(record, citationId),
      },

      // Integrity hash of this citation package
      packageHash: createHash('sha256')
        .update(JSON.stringify({ slug, licenseeAddress, txHash, citationId, issuedAt }))
        .digest('hex'),
    }

    // Save citation to Supabase
    await supabaseAdmin.from('citations').insert({
      citation_id: citationId,
      record_id: record.id,
      licensee_address: licenseeAddress,
      license_tx_hash: txHash || '',
      tier: tier || 'cite',
      issued_at: issuedAt,
      package_hash: citation.packageHash,
    }).select().single()

    return NextResponse.json({ citation })
  } catch (err: any) {
    console.error('[citation] error:', err)
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 })
  }
}

// GET — verify a citation by ID
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const citationId = searchParams.get('id')

  if (!citationId || !supabaseAdmin) {
    return NextResponse.json({ error: 'Missing citation ID' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('citations')
    .select(`
      citation_id, licensee_address, license_tx_hash, tier, issued_at, package_hash,
      records (slug, title, publisher_name, content_hash, aptos_tx_hash, created_at)
    `)
    .eq('citation_id', citationId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Citation not found' }, { status: 404 })
  }

  return NextResponse.json({ valid: true, citation: data })
}
