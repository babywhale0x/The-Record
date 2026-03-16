'use client'

import { useWallet, groupAndSortWallets, isInstallRequired } from '@aptos-labs/wallet-adapter-react'
import { useContext, createContext, useState, useContext as useCtx, ReactNode } from 'react'
import { useWallet, groupAndSortWallets } from '@aptos-labs/wallet-adapter-react'
import { createContext, useState, useContext as useCtx, ReactNode } from 'react'
import styles from './WalletModal.module.css'

const ModalContext = createContext<{
  isOpen: boolean
  open: () => void
  close: () => void
} | null>(null)

export function WalletModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <ModalContext.Provider value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
    </ModalContext.Provider>
  )
}

export function useWalletModal() {
  const ctx = useCtx(ModalContext)
  if (!ctx) throw new Error('useWalletModal must be used within WalletModalProvider')
  return ctx
}

export default function WalletModal() {
  const { wallets = [], connect } = useWallet()
  const hasAptosConnectConfig = Boolean(process.env.NEXT_PUBLIC_APTOS_CONNECT_DAPP_ID)
  const { isOpen, close } = useWalletModal()

  if (!isOpen) return null

  const { aptosConnectWallets, availableWallets, installableWallets } = groupAndSortWallets(wallets)

  const handleConnect = async (walletName: string) => {
    try {
      await connect(walletName as any)
      close()
    } catch (e: any) {
      console.error('Connect error:', e)
    }
  }

  return (
    <div className={styles.overlay} onClick={close}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.hexIcon}>⬡</span>
            <h2 className={styles.title}>Connect Wallet</h2>
          </div>
          <button className={styles.closeBtn} onClick={close}>✕</button>
        </div>

        <p className={styles.subtitle}>Your wallet is your identity on The Record.</p>

        {/* Aptos Connect — Google / Apple sign-in */}
        {aptosConnectWallets.length > 0 && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>SIGN IN — NO EXTENSION NEEDED</span>
            <div className={styles.socialRow}>
              {aptosConnectWallets.map((wallet) => (
                <button
                  key={wallet.name}
                  className={styles.socialBtn}
                  onClick={() => handleConnect(wallet.name)}
                >
                  {wallet.icon && (
                    <img src={wallet.icon} alt={wallet.name} width={18} height={18} style={{ borderRadius: 3 }} />
                  )}
                  {wallet.name}
                </button>
              ))}
            </div>
            <p className={styles.socialNote}>Powered by Aptos Connect · No crypto experience needed</p>
          </div>
        )}

        {aptosConnectWallets.length === 0 && !hasAptosConnectConfig && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>SIGN IN — NO EXTENSION NEEDED</span>
            <p className={styles.socialNote}>
              Aptos Connect is not configured yet. Set <code>NEXT_PUBLIC_APTOS_CONNECT_DAPP_ID</code>
              in your environment to enable Petra Web / Google sign-in.
            </p>
          </div>
        )}

        <div className={styles.divider}><span>or use a wallet extension</span></div>

        {/* Installed wallets */}
        {availableWallets.length > 0 && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>INSTALLED</span>
            <div className={styles.options}>
              {availableWallets.map((wallet) => (
                <button
                  key={wallet.name}
                  className={styles.option}
                  onClick={() => handleConnect(wallet.name)}
                >
                  {wallet.icon && (
                    <img src={wallet.icon} alt={wallet.name} width={28} height={28} className={styles.walletImg} />
                  )}
                  <span className={styles.optionInfo}>
                    <span className={styles.optionName}>{wallet.name}</span>
                    <span className={styles.optionDesc}>Ready to connect</span>
                  </span>
                  <span className={styles.optionArrow}>→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Installable wallets */}
        {installableWallets.length > 0 && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>NOT INSTALLED</span>
            <div className={styles.options}>
              {installableWallets.slice(0, 3).map((wallet) => (
                <a
                  key={wallet.name}
                  href={(wallet as any).url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.option}
                >
                  {wallet.icon && (
                    <img src={wallet.icon} alt={wallet.name} width={28} height={28} className={styles.walletImg} />
                  )}
                  <span className={styles.optionInfo}>
                    <span className={styles.optionName}>{wallet.name}</span>
                    <span className={styles.optionDesc}>Click to install</span>
                  </span>
                  <span className={styles.optionArrow}>↗</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
