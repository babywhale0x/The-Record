'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './BottomNav.module.css'

const TABS = [
  {
    href: '/',
    label: 'Home',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
        <path d="M9 21V12h6v9"/>
      </svg>
    ),
  },
  {
    href: '/feed',
    label: 'Feed',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h16M4 10h16M4 14h10" strokeWidth={active ? '2.2' : '1.8'}/>
        <circle cx="18" cy="17" r="3" fill={active ? 'currentColor' : 'none'}/>
      </svg>
    ),
  },
  {
    href: '/ai',
    label: 'AI',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" fill={active ? 'var(--accent-subtle)' : 'none'}/>
        <path d="M21 21l-4.35-4.35"/>
        <path d="M8 11h6M11 8v6" strokeWidth={active ? '2.2' : '1.8'}/>
      </svg>
    ),
  },
  {
    href: '/publish',
    label: 'Publish',
    icon: (_active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" fill="var(--accent)" stroke="var(--accent)"/>
        <path d="M12 8v8M8 12h8" stroke="white" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    href: '/wallet',
    label: 'Wallet',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'var(--accent-subtle)' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="14" rx="2"/>
        <path d="M16 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="currentColor"/>
        <path d="M2 10h20"/>
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {TABS.map((tab) => {
          const active = tab.href === '/'
            ? pathname === '/'
            : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`${styles.tab} ${active ? styles.tabActive : ''} ${tab.label === 'Publish' ? styles.tabPublish : ''}`}
            >
              <span className={styles.icon}>{tab.icon(active)}</span>
              <span className={styles.label}>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
