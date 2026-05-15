'use client'
import { useState, useEffect } from 'react'
import { CONTENT_TYPE_LIST, type ContentType } from '@/lib/content-types'
import styles from './feed.module.css'
import Link from 'next/link'
import ContentTypeBadge from '@/components/ui/ContentTypeBadge'

interface FeedRecord {
  id: string
  slug: string
  title: string
  excerpt: string
  content_type: string
  publisher_name: string
  tags: string[]
  aptos_tx_hash?: string
  content_hash?: string
  price_view: number
  created_at: string
}

export default function FeedPage() {
  const [activeType, setActiveType] = useState<ContentType | 'all'>('all')
  const [records, setRecords] = useState<FeedRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const url = activeType === 'all'
      ? '/api/feed'
      : `/api/feed?type=${activeType}`
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setRecords(data.records || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [activeType])

  return (
    <main className={styles.page}>
      <header className={styles.topBar}>
        <h1 className={styles.title}>Feed</h1>
        <span className={styles.count}>{loading ? '…' : `${records.length} records`}</span>
      </header>

      <div className={styles.filters}>
        <button
          className={`${styles.chip} ${activeType === 'all' ? styles.chipActive : ''}`}
          onClick={() => setActiveType('all')}
        >All</button>
        {CONTENT_TYPE_LIST.map((ct) => (
          <button
            key={ct.id}
            className={`${styles.chip} ${activeType === ct.id ? styles.chipActive : ''}`}
            onClick={() => setActiveType(ct.id as ContentType)}
            style={activeType === ct.id ? { background: ct.bg, color: ct.color, borderColor: ct.border } : {}}
          >
            {ct.icon} {ct.label}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {loading ? (
          <div style={{ color: 'var(--text-muted)', padding: '40px 0', textAlign: 'center' }}>
            Loading records…
          </div>
        ) : records.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', padding: '40px 0', textAlign: 'center' }}>
            No records yet.
          </div>
        ) : (
          records.map((r) => <FeedCard key={r.id} record={r} />)
        )}
      </div>
    </main>
  )
}

function FeedCard({ record }: { record: FeedRecord }) {
  const date = new Date(record.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const hash = record.aptos_tx_hash || record.content_hash || ''
  const shortHash = hash ? hash.slice(0, 6) + '…' + hash.slice(-4) : null

  return (
    <Link href={`/records/${record.slug}`} className={styles.card}>
      <div className={styles.top}>
        <ContentTypeBadge type={record.content_type as any} size="sm" />
        <span className={styles.price}>{parseFloat(((record.price_view || 0) / 10000).toFixed(4)).toString()} APT</span>
      </div>

      <h3 className={styles.cardTitle}>{record.title}</h3>
      <p className={styles.excerpt}>{record.excerpt}</p>

      <div className={styles.publisher}>
        <span className={styles.publisherName}>{record.publisher_name}</span>
        <span className={styles.dot}>·</span>
        <span className={styles.date}>{date}</span>
      </div>

      {shortHash && (
        <div className={styles.hashRow}>
          <span className={styles.hashLabel}>TX</span>
          <span className={styles.hashValue}>{shortHash}</span>
          <span className={styles.onChain}>ON-CHAIN ✓</span>
        </div>
      )}

      <div className={styles.footer}>
        <div className={styles.tags}>
          {(record.tags || []).slice(0, 3).map((tag) => (
            <span key={tag} className={styles.tag}>#{tag}</span>
          ))}
        </div>
      </div>
    </Link>
  )
}
