'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CONTENT_TYPE_LIST, type ContentType } from '@/lib/content-types'
import ContentTypeBadge from '@/components/ui/ContentTypeBadge'
import styles from './home.module.css'

interface HomeRecord {
  id: string; slug: string; title: string; excerpt: string
  content_type: string; publisher_name: string; tags: string[]
  aptos_tx_hash?: string; price_view: number; created_at: string
}

function RecordCard({ record }: { record: HomeRecord }) {
  const date = new Date(record.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
  const hash = record.aptos_tx_hash || ''
  return (
    <Link href={`/records/${record.slug}`} className={styles.card}>
      <div className={styles.cardTop}>
        <ContentTypeBadge type={record.content_type as any} size="sm" />
        <span className={styles.cardPrice}>{parseFloat(((record.price_view || 0) / 10000).toFixed(4)).toString()} APT</span>
      </div>
      <h3 className={styles.cardTitle}>{record.title}</h3>
      <p className={styles.cardExcerpt}>{record.excerpt}</p>
      <div className={styles.cardMeta}>
        <span className={styles.cardPublisher}>{record.publisher_name}</span>
        <span className={styles.cardDot}>·</span>
        <span className={styles.cardDate}>{date}</span>
      </div>
      {hash && (
        <div className={styles.cardHash}>
          <span className={styles.cardHashLabel}>TX</span>
          <span className={styles.cardHashValue}>{hash.slice(0, 8)}…{hash.slice(-6)}</span>
          <span className={styles.cardOnChain}>ON-CHAIN ✓</span>
        </div>
      )}
    </Link>
  )
}

export default function HomePage() {
  const [activeType, setActiveType] = useState<ContentType | 'all'>('all')
  const [records, setRecords] = useState<HomeRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const url = activeType === 'all' ? '/api/feed' : `/api/feed?type=${activeType}`
    fetch(url)
      .then((r) => r.json())
      .then((data) => { setRecords(data.records || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [activeType])

  const featured = records.slice(0, 3)
  const recent = records.slice(3, 9)

  return (
    <main className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.logo}>The<span>Record</span></div>
        <div className={styles.topBarRight}>
          <span className={styles.networkBadge}>
            <span className={styles.networkDot} />
            Aptos Testnet
          </span>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroEyebrow}>
          <span className={styles.eyebrowDot} />
          Permanent · Verified · On-Chain
        </div>
        <h1 className={styles.heroHeading}>The permanent record<br />for hard knowledge.</h1>
        <p className={styles.heroSub}>
          Every investigation, legal filing, research paper, and on-chain analysis — cryptographically committed to Aptos. Impossible to alter. Impossible to delete.
        </p>
        <div className={styles.heroStats}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{loading ? '…' : records.length}+</span>
            <span className={styles.statLabel}>Records archived</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}><span className={styles.statNum}>$0.014</span><span className={styles.statLabel}>Per GB on-chain</span></div>
          <div className={styles.statDivider} />
          <div className={styles.stat}><span className={styles.statNum}>100%</span><span className={styles.statLabel}>Tamper-evident</span></div>
        </div>
      </section>

      <section className={styles.typeSection}>
        <div className={styles.typeScroll}>
          <button
            className={`${styles.typeChip} ${activeType === 'all' ? styles.typeChipActive : ''}`}
            onClick={() => setActiveType('all')}
          >All</button>
          {CONTENT_TYPE_LIST.map((ct) => (
            <button
              key={ct.id}
              className={`${styles.typeChip} ${activeType === ct.id ? styles.typeChipActive : ''}`}
              onClick={() => setActiveType(ct.id as ContentType)}
              style={activeType === ct.id ? { background: ct.bg, color: ct.color, borderColor: ct.border } : {}}
            >
              <span>{ct.icon}</span> {ct.label}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <section className={styles.section}>
          <p style={{ color: 'var(--text-muted)', padding: '40px 20px' }}>Loading records…</p>
        </section>
      ) : records.length === 0 ? (
        <section className={styles.section}>
          <p style={{ color: 'var(--text-muted)', padding: '40px 20px' }}>No records published yet.</p>
        </section>
      ) : (
        <>
          {featured.length > 0 && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Featured</h2>
                <span className={styles.sectionSub}>Most recent records</span>
              </div>
              <div className={styles.featuredGrid}>
                {featured.map((r) => <RecordCard key={r.id} record={r} />)}
              </div>
            </section>
          )}

          {recent.length > 0 && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Recent</h2>
                <Link href="/feed" className={styles.sectionLink}>View all →</Link>
              </div>
              <div className={styles.recentList}>
                {recent.map((r) => <RecordCard key={r.id} record={r} />)}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  )
}
