'use client'

import type { Article } from './DashboardShell'
import styles from './DashboardHome.module.css'

interface Props {
  articles: Article[]
  onEdit: (id: string) => void
  onNewArticle: () => void
}

const STATUS_LABELS = {
  published: { label: 'Published', className: 'published' },
  draft:     { label: 'Draft',     className: 'draft' },
  scheduled: { label: 'Scheduled', className: 'scheduled' },
}

const ACCESS_LABELS = {
  free:             'Free',
  'pay-per-article':'Pay-per-article',
  subscription:     'Subscription',
}

export default function DashboardHome({ articles, onEdit, onNewArticle }: Props) {
  const published = articles.filter((a) => a.status === 'published')
  const drafts    = articles.filter((a) => a.status === 'draft')
  const totalReads    = articles.reduce((s, a) => s + a.reads, 0)
  const onChainCount  = articles.filter((a) => a.onChain).length

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Dashboard</div>
          <h1 className={styles.heading}>Your Record.</h1>
        </div>
        <button className={styles.newBtn} onClick={onNewArticle}>
          + New Article
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <StatCard
          label="Total Earnings"
          value="₦147,400"
          sub="Wallet balance"
          highlight
        />
        <StatCard
          label="Total Reads"
          value={totalReads.toLocaleString()}
          sub={`Across ${published.length} published articles`}
        />
        <StatCard
          label="Articles Published"
          value={String(published.length)}
          sub={`${drafts.length} draft${drafts.length !== 1 ? 's' : ''} in progress`}
        />
        <StatCard
          label="On-Chain Records"
          value={String(onChainCount)}
          sub="Tamper-evident via Aptos"
          verified
        />
      </div>

      {/* Chain notice */}
      <div className={styles.chainNotice}>
        <span className={styles.chainDot} />
        <span>
          <strong>{onChainCount} article{onChainCount !== 1 ? 's' : ''}</strong> permanently archived on Shelby Protocol ·{' '}
          <strong>Aptos testnet</strong> · All hashes verifiable at{' '}
          <a href="https://explorer.shelby.xyz/testnet" target="_blank" rel="noreferrer">
            explorer.shelby.xyz
          </a>
        </span>
      </div>

      {/* Articles table */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>YOUR ARTICLES</span>
          <span className={styles.sectionCount}>{articles.length} total</span>
        </div>

        <div className={styles.table}>
          <div className={styles.tableHead}>
            <div className={styles.colTitle}>Title</div>
            <div className={styles.colStatus}>Status</div>
            <div className={styles.colAccess}>Access</div>
            <div className={styles.colReads}>Reads</div>
            <div className={styles.colEarnings}>Earnings</div>
            <div className={styles.colChain}>On-Chain</div>
            <div className={styles.colActions} />
          </div>

          {articles.map((article) => {
            const s = STATUS_LABELS[article.status]
            return (
              <div key={article.id} className={styles.tableRow}>
                <div className={styles.colTitle}>
                  <div className={styles.articleTitle}>{article.title}</div>
                  {article.publishedAt && (
                    <div className={styles.articleDate}>{article.publishedAt}</div>
                  )}
                </div>
                <div className={styles.colStatus}>
                  <span className={`${styles.statusBadge} ${styles[s.className]}`}>
                    {s.label}
                  </span>
                </div>
                <div className={styles.colAccess}>
                  <span className={styles.accessLabel}>
                    {ACCESS_LABELS[article.accessModel]}
                    {article.price && (
                      <span className={styles.price}> · {article.price}</span>
                    )}
                  </span>
                </div>
                <div className={styles.colReads}>
                  <span className={styles.numVal}>{article.reads.toLocaleString()}</span>
                </div>
                <div className={styles.colEarnings}>
                  <span className={`${styles.numVal} ${article.earnings !== '₦0' ? styles.earning : styles.zero}`}>
                    {article.earnings}
                  </span>
                </div>
                <div className={styles.colChain}>
                  {article.onChain ? (
                    <span className={styles.chainVerified} title="Archived on Aptos">
                      <span className={styles.chainVerifiedDot} />⛓
                    </span>
                  ) : (
                    <span className={styles.chainPending}>—</span>
                  )}
                </div>
                <div className={styles.colActions}>
                  <button
                    className={styles.editBtn}
                    onClick={() => onEdit(article.id)}
                  >
                    Edit
                  </button>
                  {article.status === 'published' && (
                    <a
                      href={`/investigations/${article.id}`}
                      className={styles.viewBtn}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View ↗
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick tips */}
      <div className={styles.tips}>
        <div className={styles.tipsTitle}>QUICK TIPS</div>
        <div className={styles.tipsGrid}>
          <Tip
            icon="🔒"
            title="Attach source documents"
            body="Upload PDFs alongside your article — each gets a tamper-evident hash committed to Aptos automatically."
          />
          <Tip
            icon="⏳"
            title="Schedule a dead man's switch"
            body="Set a future date in the editor. Your article becomes public on that date regardless of what happens to this account."
          />
          <Tip
            icon="🔍"
            title="Search the archive before you write"
            body="The government archive has INEC, BPP, EFCC documents — search it for source material directly from the editor."
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label, value, sub, highlight, verified,
}: {
  label: string
  value: string
  sub: string
  highlight?: boolean
  verified?: boolean
}) {
  return (
    <div className={`${styles.statCard} ${highlight ? styles.statHighlight : ''}`}>
      <div className={styles.statLabel}>{label}</div>
      <div className={`${styles.statValue} ${highlight ? styles.statValueGold : ''}`}>
        {value}
      </div>
      <div className={styles.statSub}>
        {verified && <span className={styles.verifiedDot} />}
        {sub}
      </div>
    </div>
  )
}

function Tip({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className={styles.tip}>
      <div className={styles.tipIcon}>{icon}</div>
      <div>
        <div className={styles.tipTitle}>{title}</div>
        <div className={styles.tipBody}>{body}</div>
      </div>
    </div>
  )
}
