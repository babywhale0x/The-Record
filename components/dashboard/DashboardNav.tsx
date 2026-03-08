'use client'

import Link from 'next/link'
import type { DashboardView } from './DashboardShell'
import styles from './DashboardNav.module.css'

interface Props {
  view: DashboardView
  onNavigate: (v: DashboardView) => void
  onNewArticle: () => void
}

const NAV_ITEMS = [
  { id: 'home' as DashboardView, icon: '◈', label: 'Overview' },
]

export default function DashboardNav({ view, onNavigate, onNewArticle }: Props) {
  return (
    <aside className={styles.nav}>
      {/* Wordmark */}
      <div className={styles.top}>
        <Link href="/" className={styles.wordmark}>
          The<span>Record</span>
        </Link>
        <div className={styles.journalist}>
          <div className={styles.avatar}>FO</div>
          <div className={styles.journalistInfo}>
            <div className={styles.journalistName}>Fisayo Ogunleye</div>
            <div className={styles.journalistRole}>Journalist</div>
          </div>
          <div className={styles.onlineIndicator} title="Active" />
        </div>
      </div>

      {/* New article CTA */}
      <button className={styles.newBtn} onClick={onNewArticle}>
        <span className={styles.newBtnIcon}>+</span>
        New Article
      </button>

      {/* Nav links */}
      <nav className={styles.links}>
        <div className={styles.navSection}>WORKSPACE</div>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`${styles.navItem} ${view === item.id ? styles.navItemActive : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            {item.label}
          </button>
        ))}
        <button
          className={`${styles.navItem} ${(view === 'new-article' || view === 'edit-article') ? styles.navItemActive : ''}`}
          onClick={onNewArticle}
        >
          <span className={styles.navIcon}>✎</span>
          Editor
        </button>
      </nav>

      <nav className={styles.links} style={{ marginTop: 0 }}>
        <div className={styles.navSection}>PLATFORM</div>
        <Link href="/archive" className={styles.navItem}>
          <span className={styles.navIcon}>⊟</span>
          Archive Search
        </Link>
        <Link href="/dashboard/settings" className={styles.navItem}>
          <span className={styles.navIcon}>◎</span>
          Settings
        </Link>
      </nav>

      {/* Chain status */}
      <div className={styles.chainStatus}>
        <div className={styles.chainDot} />
        <div>
          <div className={styles.chainLabel}>Shelby Testnet</div>
          <div className={styles.chainSub}>Aptos · Connected</div>
        </div>
      </div>

      {/* Wallet */}
      <div className={styles.wallet}>
        <div className={styles.walletLabel}>Wallet Balance</div>
        <div className={styles.walletAmount}>₦147,400</div>
        <button className={styles.withdrawBtn}>Withdraw →</button>
      </div>
    </aside>
  )
}
