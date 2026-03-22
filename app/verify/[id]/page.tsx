'use client'
import { useEffect, useState } from 'react'

interface CitationVerification {
  citation_id: string
  licensee_address: string
  license_tx_hash: string
  tier: string
  issued_at: string
  package_hash: string
  records: {
    slug: string; title: string
    publisher_name: string; content_hash: string
    aptos_tx_hash: string; created_at: string
  }
}

export default function VerifyPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<CitationVerification | null>(null)
  const [loading, setLoading] = useState(true)
  const [valid, setValid] = useState(false)

  useEffect(() => {
    fetch(`/api/citation?id=${params.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.valid && d.citation) {
          setData(d.citation)
          setValid(true)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.id])

  if (loading) return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#666', fontFamily: 'monospace' }}>
      Verifying citation…
    </main>
  )

  if (!valid || !data) return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#fff', fontFamily: 'sans-serif', gap: 12 }}>
      <div style={{ fontSize: 40 }}>⚠️</div>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Citation Not Found</h1>
      <p style={{ color: '#666', fontSize: 14 }}>Citation ID <code style={{ color: '#e85d2a' }}>{params.id}</code> could not be verified.</p>
      <a href="/" style={{ color: '#e85d2a', fontSize: 14 }}>← Back to The Record</a>
    </main>
  )

  const record = data.records as any

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'sans-serif', padding: '40px 20px', maxWidth: 640, margin: '0 auto' }}>
      {/* Verified badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, padding: '12px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8 }}>
        <span style={{ fontSize: 20 }}>✓</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981', letterSpacing: '0.05em' }}>CITATION VERIFIED</div>
          <div style={{ fontSize: 11, color: '#666' }}>This citation is cryptographically verified on the Aptos blockchain</div>
        </div>
      </div>

      {/* Citation ID */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Citation ID</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#e85d2a', fontFamily: 'monospace' }}>{data.citation_id}</div>
        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Issued {new Date(data.issued_at).toLocaleString()} · {data.tier.toUpperCase()} tier</div>
      </div>

      {/* Record */}
      <div style={{ marginBottom: 24, padding: 16, background: '#111', border: '1px solid #1a1a1a', borderRadius: 10 }}>
        <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Record</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{record?.title}</div>
        <div style={{ fontSize: 13, color: '#999' }}>{record?.publisher_name} · {record?.created_at ? new Date(record.created_at).toLocaleDateString() : ''}</div>
        <a href={`/records/${record?.slug}`} style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: '#e85d2a', textDecoration: 'none' }}>View record →</a>
      </div>

      {/* On-chain proof */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>On-Chain Proof</div>
        {[
          ['Content Hash', record?.content_hash],
          ['Publish TX', record?.aptos_tx_hash],
          ['License TX', data.license_tx_hash],
          ['Licensee', data.licensee_address],
          ['Package Hash', data.package_hash],
        ].map(([label, value]) => (
          <div key={label} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid #1a1a1a', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 11, color: '#666', minWidth: 100, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.06em', paddingTop: 2 }}>{label}</span>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#ccc', wordBreak: 'break-all' }}>{value || '—'}</span>
          </div>
        ))}
      </div>

      {data.license_tx_hash && (
        <a
          href={`https://explorer.aptoslabs.com/txn/${data.license_tx_hash}?network=testnet`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-block', padding: '10px 20px', background: '#e85d2a', color: '#fff', borderRadius: 7, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
        >
          View on Aptos Explorer ↗
        </a>
      )}
    </main>
  )
}
