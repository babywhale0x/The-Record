'use client'

import { useWallet } from '@/contexts/WalletContext'
import styles from './WalletModal.module.css'

const WALLET_OPTIONS = [
  {
    id: 'petra' as const,
    name: 'Petra Wallet',
    description: 'Browser extension',
    icon: (
      <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="#1A1A2E"/>
        <path d="M20 8C13.37 8 8 13.37 8 20C8 26.63 13.37 32 20 32C26.63 32 32 26.63 32 20C32 13.37 26.63 8 20 8ZM20 28C15.58 28 12 24.42 12 20C12 15.58 15.58 12 20 12C24.42 12 28 15.58 28 20C28 24.42 24.42 28 20 28Z" fill="#7B6FF0"/>
        <circle cx="20" cy="20" r="4" fill="#7B6FF0"/>
      </svg>
    ),
  },
  {
    id: 'martian' as const,
    name: 'Martian Wallet',
    description: 'Browser extension',
    icon: (
      <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="#0D1117"/>
        <ellipse cx="20" cy="18" rx="8" ry="9" fill="#4ADE80"/>
        <circle cx="17" cy="17" r="2" fill="#0D1117"/>
        <circle cx="23" cy="17" r="2" fill="#0D1117"/>
        <path d="M14 26 Q20 30 26 26" stroke="#4ADE80" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <line x1="13" y1="15" x2="10" y2="12" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="27" y1="15" x2="30" y2="12" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'pontem' as const,
    name: 'Pontem Wallet',
    description: 'Browser extension',
    icon: (
      <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="#13111A"/>
        <path d="M10 28 Q15 12 20 16 Q25 20 30 12" stroke="#F97316" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <circle cx="20" cy="16" r="3" fill="#F97316"/>
      </svg>
    ),
  },
]

export default function WalletModal() {
  const { isModalOpen, closeConnectModal, connect, connecting, error } = useWallet()

  if (!isModalOpen) return null

  return (
    <div className={styles.overlay} onClick={closeConnectModal}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.hexIcon}>⬡</span>
            <h2 className={styles.title}>Connect Wallet</h2>
          </div>
          <button className={styles.closeBtn} onClick={closeConnectModal}>✕</button>
        </div>

        <p className={styles.subtitle}>
          Your wallet is your identity on The Record — no email, no password required.
        </p>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>CRYPTO WALLET</span>
          <div className={styles.options}>
            {WALLET_OPTIONS.map(w => (
              <button
                key={w.id}
                className={styles.option}
                onClick={() => connect(w.id)}
                disabled={connecting}
              >
                <span className={styles.optionIcon}>{w.icon}</span>
                <span className={styles.optionInfo}>
                  <span className={styles.optionName}>{w.name}</span>
                  <span className={styles.optionDesc}>{w.description}</span>
                </span>
                <span className={styles.optionArrow}>
                  {connecting ? (
                    <span className={styles.spinner} />
                  ) : '→'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>SOCIAL SIGN IN</span>
          <button
            className={styles.socialOption}
            onClick={() => window.open('https://web.petra.app', '_blank')}
          >
            <span className={styles.socialIcon}>
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="10" fill="#1A1A2E"/>
                <path d="M20 8C13.37 8 8 13.37 8 20C8 26.63 13.37 32 20 32C26.63 32 32 26.63 32 20C32 13.37 26.63 8 20 8ZM20 28C15.58 28 12 24.42 12 20C12 15.58 15.58 12 20 12C24.42 12 28 15.58 28 20C28 24.42 24.42 28 20 28Z" fill="#7B6FF0"/>
                <circle cx="20" cy="20" r="4" fill="#7B6FF0"/>
              </svg>
            </span>
            <span className={styles.optionInfo}>
              <span className={styles.optionName}>Continue with Petra</span>
              <span className={styles.optionDesc}>Sign in with email or Apple — no crypto needed</span>
            </span>
            <span className={styles.externalIcon}>↗</span>
          </button>
          <p className={styles.socialNote}>
            New to crypto? Sign in with your email or Apple account at web.petra.app to create a wallet instantly.
          </p>
        </div>

        {error && (
          <div className={styles.error}>
            <span>⚠</span> {error}
          </div>
        )}
      </div>
    </div>
  )
}
