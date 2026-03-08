import Link from 'next/link'
import ContentTypeBadge from './ContentTypeBadge'
import { type Record } from '@/lib/records'
import styles from './RecordCard.module.css'

interface Props {
  record: Record
  variant?: 'default' | 'featured' | 'compact'
}

function shortHash(hash: string) {
  return hash.slice(0, 6) + '…' + hash.slice(-4)
}

function formatCount(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

export default function RecordCard({ record, variant = 'default' }: Props) {
  const date = new Date(record.publishedAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <Link href={`/records/${record.slug}`} className={`${styles.card} ${styles[variant]}`}>
      {/* Top row: type badge + tier price */}
      <div className={styles.top}>
        <ContentTypeBadge type={record.contentType} size="sm" />
        <span className={styles.price}>${record.basePriceUsd} View</span>
      </div>

      {/* Title */}
      <h3 className={styles.title}>{record.title}</h3>

      {/* Excerpt — only on default + featured */}
      {variant !== 'compact' && (
        <p className={styles.excerpt}>{record.excerpt}</p>
      )}

      {/* Publisher row */}
      <div className={styles.publisher}>
        <span className={styles.publisherName}>
          {record.publisherName}
          {record.publisherVerified && (
            <span className={styles.verified} title="Verified publisher">✓</span>
          )}
        </span>
        <span className={styles.dot}>·</span>
        <span className={styles.date}>{date}</span>
      </div>

      {/* Block hash */}
      <div className={styles.hashRow}>
        <span className={styles.hashLabel}>BLOCK</span>
        <span className={styles.hashValue}>{shortHash(record.blockHash)}</span>
        <span className={styles.onChain}>ON-CHAIN ✓</span>
      </div>

      {/* Stats + tags */}
      <div className={styles.footer}>
        <div className={styles.stats}>
          <span title="Views">👁 {formatCount(record.viewCount)}</span>
          <span title="Licenses issued">⚖️ {formatCount(record.licenseCount)}</span>
        </div>
        <div className={styles.tags}>
          {record.tags.slice(0, 3).map((tag) => (
            <span key={tag} className={styles.tag}>#{tag}</span>
          ))}
        </div>
      </div>
    </Link>
  )
}
