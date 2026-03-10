'use client'

import { useWallet } from '@/contexts/WalletContext'
import styles from './WalletModal.module.css'

const WALLET_OPTIONS = [
  {
    id: 'petra' as const,
    name: 'Petra',
    description: 'Most popular Aptos wallet',
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
    name: 'Martian',
    description: 'Aptos & Sui wallet',
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
    name: 'Pontem',
    description: 'Multi-chain wallet',
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
          Your wallet is your identity on The Record.
        </p>

        {/* Social login — Aptos Connect (formerly AptosConnect) */}
        <div className={styles.section}>
          <span className={styles.sectionLabel}>SIGN IN — NO EXTENSION NEEDED</span>
          <button
            className={styles.socialPrimary}
            onClick={() => connect('aptos-connect')}
            disabled={connecting}
          >
            <span className={styles.socialIcons}>
              {/* Google */}
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {/* Apple */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </span>
            <span className={styles.socialPrimaryText}>
              <span className={styles.socialPrimaryTitle}>Continue with Google or Apple</span>
              <span className={styles.socialPrimaryDesc}>Powered by Aptos Connect · No extension needed</span>
            </span>
            <span className={styles.optionArrow}>
              {connecting ? <span className={styles.spinner} /> : '↗'}
            </span>
          </button>
        </div>

        <div className={styles.divider}><span>or use a wallet extension</span></div>

        {/* Extension wallets */}
        <div className={styles.section}>
          <span className={styles.sectionLabel}>BROWSER EXTENSION</span>
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
                  {connecting ? <span className={styles.spinner} /> : '→'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className={styles.error}>
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  )
}
