'use client'
import { useState } from 'react'
import styles from './CitationModal.module.css'

interface CitationData {
  citationId: string
  issuedAt: string
  tier: string
  record: {
    slug: string; title: string; excerpt: string
    contentType: string; publisherName: string
    publishedAt: string; tags: string[]
  }
  proof: {
    contentHash: string; publishTxHash: string
    licenseTxHash: string; shelbyBlobName: string
    explorerUrl: string; verificationUrl: string
  }
  licensee: { address: string; licensedAt: string }
  formats: { apa: string; mla: string; chicago: string; bluebook: string }
  packageHash: string
}

interface Props {
  citation: CitationData
  onClose: () => void
}

type FormatKey = 'apa' | 'mla' | 'chicago' | 'bluebook'
const FORMAT_LABELS: Record<FormatKey, string> = {
  apa: 'APA',
  mla: 'MLA',
  chicago: 'Chicago',
  bluebook: 'Bluebook (Legal)',
}

export default function CitationModal({ citation, onClose }: Props) {
  const [activeFormat, setActiveFormat] = useState<FormatKey>('apa')
  const [copied, setCopied] = useState<string | null>(null)

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(citation, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `citation-${citation.citationId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadTXT = () => {
    const text = `THE RECORD — CITATION CERTIFICATE
=====================================
Citation ID: ${citation.citationId}
Issued: ${new Date(citation.issuedAt).toLocaleString()}
Tier: ${citation.tier.toUpperCase()}

RECORD
------
Title: ${citation.record.title}
Publisher: ${citation.record.publisherName}
Published: ${new Date(citation.record.publishedAt).toLocaleDateString()}
Type: ${citation.record.contentType}

ON-CHAIN PROOF
--------------
Content Hash: ${citation.proof.contentHash}
Publish TX: ${citation.proof.publishTxHash}
License TX: ${citation.proof.licenseTxHash}
Explorer: ${citation.proof.explorerUrl}
Verify: ${citation.proof.verificationUrl}

LICENSEE
--------
Address: ${citation.licensee.address}
Licensed At: ${new Date(citation.licensee.licensedAt).toLocaleString()}

CITATION FORMATS
----------------
APA:
${citation.formats.apa}

MLA:
${citation.formats.mla}

Chicago:
${citation.formats.chicago}

Bluebook (Legal):
${citation.formats.bluebook}

PACKAGE INTEGRITY
-----------------
Package Hash: ${citation.packageHash}
`
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `citation-${citation.citationId}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.icon}>📋</span>
            <div>
              <h2 className={styles.title}>Citation Certificate</h2>
              <span className={styles.citationId}>{citation.citationId}</span>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Record info */}
        <div className={styles.recordBar}>
          <span className={styles.recordTitle}>{citation.record.title}</span>
          <span className={styles.recordMeta}>
            {citation.record.publisherName} · {new Date(citation.record.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* On-chain proof */}
        <div className={styles.proofSection}>
          <h3 className={styles.sectionTitle}>On-Chain Proof</h3>
          <div className={styles.proofGrid}>
            <div className={styles.proofItem}>
              <span className={styles.proofLabel}>CONTENT HASH</span>
              <span className={styles.proofValue}>{citation.proof.contentHash.slice(0, 20)}…</span>
              <button className={styles.copySmall} onClick={() => copy(citation.proof.contentHash, 'hash')}>
                {copied === 'hash' ? '✓' : '⎘'}
              </button>
            </div>
            <div className={styles.proofItem}>
              <span className={styles.proofLabel}>LICENSE TX</span>
              <span className={styles.proofValue}>{citation.proof.licenseTxHash.slice(0, 20)}…</span>
              <a href={citation.proof.explorerUrl} target="_blank" rel="noopener noreferrer" className={styles.explorerLink}>↗</a>
            </div>
            <div className={styles.proofItem}>
              <span className={styles.proofLabel}>LICENSEE</span>
              <span className={styles.proofValue}>{citation.licensee.address.slice(0, 16)}…</span>
            </div>
            <div className={styles.proofItem}>
              <span className={styles.proofLabel}>ISSUED</span>
              <span className={styles.proofValue}>{new Date(citation.issuedAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className={styles.verifyRow}>
            <span className={styles.verifiedBadge}>✓ VERIFIED ON-CHAIN</span>
            <a href={citation.proof.verificationUrl} target="_blank" rel="noopener noreferrer" className={styles.verifyLink}>
              Verify citation →
            </a>
          </div>
        </div>

        {/* Citation formats */}
        <div className={styles.formatsSection}>
          <h3 className={styles.sectionTitle}>Citation Formats</h3>
          <div className={styles.formatTabs}>
            {(Object.keys(FORMAT_LABELS) as FormatKey[]).map(f => (
              <button
                key={f}
                className={`${styles.formatTab} ${activeFormat === f ? styles.formatTabActive : ''}`}
                onClick={() => setActiveFormat(f)}
              >
                {FORMAT_LABELS[f]}
              </button>
            ))}
          </div>
          <div className={styles.formatBox}>
            <p className={styles.formatText}>{citation.formats[activeFormat]}</p>
            <button
              className={styles.copyBtn}
              onClick={() => copy(citation.formats[activeFormat], 'format')}
            >
              {copied === 'format' ? '✓ Copied' : '⎘ Copy'}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.downloadBtn} onClick={downloadTXT}>
            ↓ Download .txt
          </button>
          <button className={styles.downloadBtn} onClick={downloadJSON}>
            ↓ Download .json
          </button>
          <button className={styles.closeAction} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
