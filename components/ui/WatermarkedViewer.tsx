'use client'
import { useMemo } from 'react'
import { watermarkBody, getVisualWatermark } from '@/lib/watermark'
import styles from './WatermarkedViewer.module.css'

interface Props {
  body: string
  walletAddress: string
  citationId: string
  tier: string
  contentHash?: string
}

export default function WatermarkedViewer({ body, walletAddress, citationId, tier, contentHash }: Props) {
  const watermarkedText = useMemo(() => {
    if (!walletAddress || !citationId) return body
    return watermarkBody(body, walletAddress, citationId)
  }, [body, walletAddress, citationId])

  const visualWatermark = useMemo(() => {
    return getVisualWatermark(walletAddress, citationId)
  }, [walletAddress, citationId])

  const canDownload = tier === 'license'
  const paragraphs = watermarkedText.split('\n\n').filter(Boolean)

  return (
    <div className={styles.viewer}>
      {/* Access header */}
      <div className={styles.accessHeader}>
        <div className={styles.accessLeft}>
          <span className={styles.accessTier}>{tier.toUpperCase()} ACCESS</span>
          <span className={styles.accessDivider}>·</span>
          <span className={styles.accessWallet}>
            {walletAddress.slice(0, 8)}…{walletAddress.slice(-4)}
          </span>
        </div>
        <div className={styles.accessRight}>
          <span className={styles.watermarkBadge}>🔏 Watermarked</span>
          {canDownload && (
            <button
              className={styles.downloadBtn}
              onClick={() => {
                const blob = new Blob([body], { type: 'text/plain' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `record-${citationId}.txt`
                a.click()
                URL.revokeObjectURL(url)
              }}
            >
              ↓ Download
            </button>
          )}
        </div>
      </div>

      {/* Document body with visual watermark */}
      <div
        className={styles.body}
        onContextMenu={e => tier === 'view' ? e.preventDefault() : null}
        style={{ userSelect: tier === 'view' ? 'none' : 'text' }}
      >
        {/* Diagonal visual watermark overlay */}
        <div className={styles.watermarkOverlay} aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className={styles.watermarkText}>
              {visualWatermark}
            </span>
          ))}
        </div>

        {/* Content */}
        <div className={styles.content}>
          {paragraphs.map((para, i) => (
            <p key={i} className={styles.paragraph}>{para}</p>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <span className={styles.footerLabel}>CITATION ID</span>
          <span className={styles.footerValue}>{citationId}</span>
        </div>
        {contentHash && (
          <div className={styles.footerLeft}>
            <span className={styles.footerLabel}>CONTENT HASH</span>
            <span className={styles.footerValue}>{contentHash.slice(0, 16)}…</span>
          </div>
        )}
        <span className={styles.footerNote}>
          {tier === 'view' && 'Read-only · No download · No citation rights'}
          {tier === 'cite' && 'Citation rights · Permanent record'}
          {tier === 'license' && 'Full license · Download enabled'}
        </span>
      </div>
    </div>
  )
}
