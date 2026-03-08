'use client'

import { useState } from 'react'
import Link from 'next/link'
import { INVESTIGATIONS } from '@/lib/investigations'
import type { Investigation } from '@/lib/investigations'
import styles from './InvestigationsFeed.module.css'

const CATEGORIES = [
  'All',
  'Corruption & Accountability',
  'Politics & Governance',
  'Business & Finance',
  'Human Rights',
  'Security & Conflict',
]

const ACCESS_LABELS = {
  free: { label: 'Free', className: 'free' },
  'pay-per-article': { label: 'Pay to read', className: 'paid' },
  subscription: { label: 'Subscribers', className: 'sub' },
}

export default function InvestigationsFeed() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeAccess, setActiveAccess] = useState<string>('all')

  const featured = INVESTIGATIONS.filter((i) => i.featured)
  const all = INVESTIGATIONS

  const filtered = all.filter((i) => {
    const catMatch = activeCategory === 'All' || i.category === activeCategory
    const accMatch = activeAccess === 'all' || i.accessModel === activeAccess
    return catMatch && accMatch
  })

  return (
    <div className={styles.page}>

      {/* Page header */}
      <div className={styles.pageHeader}>
        <div className="container">
          <div className={styles.headerInner}>
            <div>
              <div className={styles.eyebrow}>Investigations</div>
              <h1 className={styles.heading}>
                The stories power<br />doesn't want told.
              </h1>
            </div>
            <div className={styles.headerMeta}>
              <div className={styles.metaStat}>
                <div className={styles.metaVal}>{all.length}</div>
                <div className={styles.metaLabel}>Investigations</div>
              </div>
              <div className={styles.metaDivider} />
              <div className={styles.metaStat}>
                <div className={styles.metaVal}>{all.filter((i) => i.onChain).length}</div>
                <div className={styles.metaLabel}>On-Chain</div>
              </div>
              <div className={styles.metaDivider} />
              <div className={styles.metaStat}>
                <div className={styles.metaVal}>{all.reduce((s, i) => s + i.reads, 0).toLocaleString()}</div>
                <div className={styles.metaLabel}>Total Reads</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured strip */}
      {featured.length > 0 && (
        <div className={styles.featuredStrip}>
          <div className="container">
            <div className={styles.featuredLabel}>FEATURED</div>
            <div className={styles.featuredGrid}>
              {featured.map((inv) => (
                <FeaturedCard key={inv.slug} inv={inv} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className={styles.filterBar}>
        <div className="container">
          <div className={styles.filterInner}>
            <div className={styles.filterGroup}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`${styles.filterChip} ${activeCategory === cat ? styles.filterChipActive : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className={styles.filterDivider} />
            <div className={styles.filterGroup}>
              {[
                { id: 'all', label: 'All access' },
                { id: 'free', label: 'Free' },
                { id: 'pay-per-article', label: 'Pay-per-article' },
                { id: 'subscription', label: 'Subscribers' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  className={`${styles.filterChip} ${activeAccess === opt.id ? styles.filterChipActive : ''}`}
                  onClick={() => setActiveAccess(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Articles list */}
      <div className={styles.listSection}>
        <div className="container">
          <div className={styles.resultsMeta}>
            {filtered.length} investigation{filtered.length !== 1 ? 's' : ''}
            {activeCategory !== 'All' && ` · ${activeCategory}`}
          </div>

          <div className={styles.articleList}>
            {filtered.map((inv) => (
              <ArticleRow key={inv.slug} inv={inv} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className={styles.emptyState}>
              No investigations match your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Featured card ── */
function FeaturedCard({ inv }: { inv: Investigation }) {
  const access = ACCESS_LABELS[inv.accessModel]
  return (
    <Link href={`/investigations/${inv.slug}`} className={styles.featuredCard}>
      <div className={styles.featuredCardTop}>
        <span className={styles.featuredCategory}>{inv.category}</span>
        {inv.onChain && (
          <span className={styles.onChainBadge}>
            <span className={styles.onChainDot} />⛓ On-Chain
          </span>
        )}
      </div>
      <h2 className={styles.featuredTitle}>{inv.title}</h2>
      <p className={styles.featuredExcerpt}>{inv.excerpt}</p>
      <div className={styles.featuredFooter}>
        <div className={styles.authorChip}>
          <span className={styles.authorAvatar}>{inv.author.initials}</span>
          <span className={styles.authorName}>{inv.author.name}</span>
        </div>
        <div className={styles.featuredMeta}>
          <span className={styles.readTime}>{inv.readTime}</span>
          <span className={styles.dot}>·</span>
          <span className={`${styles.accessChip} ${styles[access.className]}`}>
            {inv.price ? `${inv.price}` : access.label}
          </span>
        </div>
      </div>
    </Link>
  )
}

/* ── Article row ── */
function ArticleRow({ inv }: { inv: Investigation }) {
  const access = ACCESS_LABELS[inv.accessModel]
  return (
    <Link href={`/investigations/${inv.slug}`} className={styles.articleRow}>
      <div className={styles.articleRowLeft}>
        <div className={styles.articleMeta}>
          <span className={styles.articleCategory}>{inv.category}</span>
          <span className={styles.dot}>·</span>
          <span className={styles.articleDate}>{inv.publishedAt}</span>
          <span className={styles.dot}>·</span>
          <span className={styles.articleReadTime}>{inv.readTime}</span>
        </div>
        <h3 className={styles.articleTitle}>{inv.title}</h3>
        <p className={styles.articleExcerpt}>{inv.excerpt}</p>
        <div className={styles.articleFooter}>
          <div className={styles.authorChip}>
            <span className={styles.authorAvatar}>{inv.author.initials}</span>
            <span className={styles.authorName}>{inv.author.name}</span>
          </div>
          <div className={styles.articleTags}>
            {inv.tags.slice(0, 3).map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.articleRowRight}>
        <div className={`${styles.accessBadge} ${styles[access.className]}`}>
          {inv.price ? inv.price : access.label}
        </div>
        {inv.onChain && (
          <div className={styles.chainIndicator}>
            <span className={styles.chainDot} />
            <span>Verified</span>
          </div>
        )}
        <div className={styles.readCount}>{inv.reads.toLocaleString()} reads</div>
        <div className={styles.docsCount}>{inv.documents.length} source doc{inv.documents.length !== 1 ? 's' : ''}</div>
      </div>
    </Link>
  )
}
