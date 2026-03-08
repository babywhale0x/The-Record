'use client'
import { useState } from 'react'
import { RECORDS } from '@/lib/records'
import { CONTENT_TYPES, LICENSE_TIERS } from '@/lib/content-types'
import ContentTypeBadge from '@/components/ui/ContentTypeBadge'
import styles from './record.module.css'

export default function RecordPage({ params }: { params: { slug: string } }) {
  const record = RECORDS.find((r) => r.slug === params.slug)
  const [activeTier, setActiveTier] = useState<string | null>(null)
  const [purchased, setPurchased] = useState(false)
  const [purchasing, setPurchasing] = useState(false)

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

  const ct = CONTENT_TYPES[record.contentType]
  const date = new Date(record.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const handlePurchase = async (tier: string) => {
    setPurchasing(true)
    setActiveTier(tier)
    await new Promise((r) => setTimeout(r, 1400))
    setPurchasing(false)
    setPurchased(true)
  }

  return (
    <main className={styles.page}>
      {/* Back */}
      <div className={styles.backRow}>
        <a href="/" className={styles.back}>← Records</a>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <ContentTypeBadge type={record.contentType} size="md" />
        <h1 className={styles.title}>{record.title}</h1>
        <p className={styles.excerpt}>{record.excerpt}</p>

        <div className={styles.meta}>
          <span className={styles.publisher}>
            {record.publisherName}
            {record.publisherVerified && <span className={styles.verified}> ✓</span>}
          </span>
          <span className={styles.metaDot}>·</span>
          <span className={styles.date}>{date}</span>
        </div>

        {/* On-chain proof bar */}
        <div className={styles.proofBar}>
          <div className={styles.proofItem}>
            <span className={styles.proofLabel}>APTOS TX</span>
            <span className={styles.proofValue}>{record.aptosTxHash.slice(0, 10)}…{record.aptosTxHash.slice(-6)}</span>
          </div>
          <div className={styles.proofDivider} />
          <div className={styles.proofItem}>
            <span className={styles.proofLabel}>BLOCK</span>
            <span className={styles.proofValue}>{record.blockHash}</span>
          </div>
          <div className={styles.proofDivider} />
          <div className={styles.proofItem}>
            <span className={styles.proofLabel}>SHELBY</span>
            <span className={styles.proofValue}>{record.shelbyBlobName}</span>
          </div>
          <span className={styles.proofVerified}>✓ VERIFIED</span>
        </div>
      </div>

      {/* Document viewer */}
      <div className={styles.viewerWrap}>
        {!purchased ? (
          <>
            {/* Locked preview */}
            <div className={styles.preview}>
              <div className={styles.previewContent}>
                <p className={styles.previewText}>
                  {record.body.slice(0, 280)}…
                </p>
              </div>
              <div className={styles.previewFade} />
            </div>

            {/* Watermark overlay hint */}
            <div className={styles.lockedBanner}>
              <span className={styles.lockedIcon}>🔒</span>
              <span className={styles.lockedText}>
                Full document locked. Select a license tier below to unlock.
              </span>
            </div>

            {/* License tiers */}
            <div className={styles.tiers}>
              <h2 className={styles.tiersTitle}>Choose a license</h2>
              <div className={styles.tierGrid}>
                {Object.values(LICENSE_TIERS).map((tier) => {
                  const price = tier.id === 'institutional' ? null : record.tiers[tier.id as keyof typeof record.tiers]
                  return (
                    <div
                      key={tier.id}
                      className={`${styles.tierCard} ${activeTier === tier.id ? styles.tierCardActive : ''}`}
                      style={activeTier === tier.id ? { borderColor: tier.color } : {}}
                    >
                      <div className={styles.tierTop}>
                        <span className={styles.tierLabel} style={{ color: tier.color }}>{tier.label}</span>
                        {price ? (
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
                        {purchasing && activeTier === tier.id ? 'Processing…' : tier.id === 'institutional' ? 'Contact us →' : `Unlock for $${price} →`}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        ) : (
          /* Unlocked viewer */
          <div className={styles.viewer}>
            <div className={styles.viewerHeader}>
              <span className={styles.viewerTier}>
                {activeTier?.toUpperCase()} ACCESS
              </span>
              <span className={styles.viewerWatermark}>
                Watermarked · 0x3f9a…b44c
              </span>
            </div>
            <div
              className={styles.viewerBody}
              onContextMenu={(e) => e.preventDefault()}
            >
              {record.body.split('\n\n').map((para, i) => (
                <p key={i} className={styles.viewerPara}>{para}</p>
              ))}
            </div>
            {/* Source documents */}
            {record.sourceDocs.length > 0 && (
              <div className={styles.sourceDocs}>
                <h3 className={styles.sourceDocsTitle}>Source Documents</h3>
                {record.sourceDocs.map((doc) => (
                  <div key={doc.id} className={styles.sourceDoc}>
                    <span className={styles.sourceDocIcon}>📎</span>
                    <div className={styles.sourceDocInfo}>
                      <span className={styles.sourceDocName}>{doc.name}</span>
                      <span className={styles.sourceDocHash}>{doc.contentHash.slice(0, 24)}…</span>
                    </div>
                    <button className={styles.sourceDocVerify}>Verify ✓</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tags */}
      <div className={styles.tags}>
        {record.tags.map((tag) => (
          <span key={tag} className={styles.tag}>#{tag}</span>
        ))}
      </div>
    </main>
  )
}
