'use client'
import { useState } from 'react'
import RecordCard from '@/components/ui/RecordCard'
import { RECORDS } from '@/lib/records'
import { CONTENT_TYPE_LIST, type ContentType } from '@/lib/content-types'
import styles from './feed.module.css'

export default function FeedPage() {
  const [activeType, setActiveType] = useState<ContentType | 'all'>('all')

  const filtered = activeType === 'all'
    ? RECORDS
    : RECORDS.filter((r) => r.contentType === activeType)

  return (
    <main className={styles.page}>
      <header className={styles.topBar}>
        <h1 className={styles.title}>Feed</h1>
        <span className={styles.count}>{filtered.length} records</span>
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
            onClick={() => setActiveType(ct.id)}
            style={activeType === ct.id ? { background: ct.bg, color: ct.color, borderColor: ct.border } : {}}
          >
            {ct.icon} {ct.label}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {filtered.map((r) => (
          <RecordCard key={r.id} record={r} />
        ))}
      </div>
    </main>
  )
}
