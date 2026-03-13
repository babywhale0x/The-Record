'use client'
import { useState, useEffect } from 'react'
import { CONTENT_TYPES, LICENSE_TIERS } from '@/lib/content-types'
import ContentTypeBadge from '@/components/ui/ContentTypeBadge'
import styles from './record.module.css'

interface RecordData {
  id: string
  slug: string
  title: string
  excerpt: string
  body?: string
  content_type: string
  publisher_name: string
  publisher_id?: string
  tags: string[]
  blob_name?: string
  aptos_tx_hash?: string
  content_hash?: string
  shelby_network?: string
  price_view: number
  price_cite: number
  price_license: number
  created_at: string
  source_documents?: { id: string; name: string; content_hash: string }[]
}

export default function RecordPage({ params }: { params: { slug: string } }) {
  const [record, setRecord] = useState<RecordData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTier, setActiveTier] = useState<string | null>(null)
  const [purchased, setPurchased] = useState(false)
  const [purchasing, setPurchasing] = useState(false)

  useEffect(() => {
    fetch(`/api/records/${params.slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.record) setRecord(data.record)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.slug])

  const handlePurchase = async (tier: string) => {
    setPurchasing(true)
    setActiveTier(tier)
    await new Promise((r) => setTimeout(r, 1400))
    setPurchasing(false)
    setPurchased(true)
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.notFound}>
          <p>Loading…</p>
        </div>
      </main>
    )
  }

  if (!record) {
    return (
      <main className={styles.page}>
        <div className={styles.notFound}>
          <h1>Record not found</h1>
          <a href="/">← Back to home</a>
        </div>
      </main>
    )
  }

  const ct = CONTENT_TYPES[record.content_type as keyof typeof CONTENT_TYPES]
  const date = new Date(record.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  const tiers = {
    view: record.price_view / 100,
    cite: record.price_cite / 100,
    license: record.price_license / 100,
  }

  const txHash = record.aptos_tx_hash || ''
  const bodyText = record.body || record.excerpt || ''

  return (
    <main className={styles.page}>
      <div className={styles.backRow}>
        <a href="/" className={styles.back}>← Records</a>
      </div>

      <div className={styles.header}>
        <ContentTypeBadge type={record.content_type as any} size="md" />
        <h1 className={styles.title}>{record.title}</h1>
        <p className={styles.excerpt}>{record.excerpt}</p>

        <div className={styles.meta}>
          <span className={styles.publisher}>{record.publisher_name}</span>
          <span className={styles.metaDot}>·</span>
          <span className={styles.date}>{date}</span>
        </div>

        {txHash && (
          <div className={styles.proofBar}>
            <div className={styles.proofItem}>
              <span className={styles.proofLabel}>APTOS TX</span>
              <span className={styles.proofValue}>{txHash.slice(0, 10)}…{txHash.slice(-6)}</span>
            </div>
            <div className={styles.proofDivider} />
            <div className={styles.proofItem}>
              <span className={styles.proofLabel}>SHELBY</span>
              <span className={styles.proofValue}>{(record.blob_name || '').slice(0, 20)}…</span>
            </div>
            <div className={styles.proofDivider} />
            <div className={styles.proofItem}>
              <span className={styles.proofLabel}>NETWORK</span>
              <span className={styles.proofValue}>{record.shelby_network || 'testnet'}</span>
            </div>
            <span className={styles.proofVerified}>✓ VERIFIED</span>
          </div>
        )}
      </div>

      <div className={styles.viewerWrap}>
        {!purchased ? (
          <>
            <div className={styles.preview}>
              <div className={styles.previewContent}>
                <p className={styles.previewText}>
                  {bodyText.slice(0, 280)}{bodyText.length > 280 ? '…' : ''}
                </p>
              </div>
              <div className={styles.previewFade} />
            </div>

            <div className={styles.lockedBanner}>
              <span className={styles.lockedIcon}>🔒</span>
              <span className={styles.lockedText}>
                Full document locked. Select a license tier below to unlock.
              </span>
            </div>

            <div className={styles.tiers}>
              <h2 className={styles.tiersTitle}>Choose a license</h2>
              <div className={styles.tierGrid}>
                {Object.values(LICENSE_TIERS).map((tier) => {
                  const price = tiers[tier.id as keyof typeof tiers]
                  return (
                    <div
                      key={tier.id}
                      className={`${styles.tierCard} ${activeTier === tier.id ? styles.tierCardActive : ''}`}
                      style={activeTier === tier.id ? { borderColor: tier.color } : {}}
                    >
                      <div className={styles.tierTop}>
                        <span className={styles.tierLabel} style={{ color: tier.color }}>{tier.label}</span>
                        {price != null ? (
                          <span className={styles.tierPrice}>${price}</span>
                        ) : (
                          <span className={styles.tierPrice}>Custom</span>
                        )}
                      </div>
                      <p className={styles.tierDesc}>{tier.description}</p>
                      <ul className={styles.tierFeatures}>
                        {tier.features.map((f) => (
                          <li key={f}>
                            <span className={styles.tierCheck} style={{ color: tier.color }}>✓</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                      <button
                        className={styles.tierBtn}
                        style={{ background: tier.color }}
                        onClick={() => handlePurchase(tier.id)}
                        disabled={purchasing}
                      >
                        {purchasing && activeTier === tier.id
                          ? 'Processing…'
                          : tier.id === 'institutional'
                          ? 'Contact us →'
                          : `Unlock for $${price} →`}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        ) : (
          <div className={styles.viewer}>
            <div className={styles.viewerHeader}>
              <span className={styles.viewerTier}>{activeTier?.toUpperCase()} ACCESS</span>
              <span className={styles.viewerWatermark}>Watermarked · {record.content_hash?.slice(0, 10) || '0x…'}</span>
            </div>
            <div className={styles.viewerBody} onContextMenu={(e) => e.preventDefault()}>
              {bodyText.split('\n\n').map((para, i) => (
                <p key={i} className={styles.viewerPara}>{para}</p>
              ))}
            </div>
            {record.source_documents && record.source_documents.length > 0 && (
              <div className={styles.sourceDocs}>
                <h3 className={styles.sourceDocsTitle}>Source Documents</h3>
                {record.source_documents.map((doc) => (
                  <div key={doc.id} className={styles.sourceDoc}>
                    <span className={styles.sourceDocIcon}>📎</span>
                    <div className={styles.sourceDocInfo}>
                      <span className={styles.sourceDocName}>{doc.name}</span>
                      <span className={styles.sourceDocHash}>{doc.content_hash?.slice(0, 24)}…</span>
                    </div>
                    <button className={styles.sourceDocVerify}>Verify ✓</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.tags}>
        {(record.tags || []).map((tag) => (
          <span key={tag} className={styles.tag}>#{tag}</span>
        ))}
      </div>
    </main>
  )
}
