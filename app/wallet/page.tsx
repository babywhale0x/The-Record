'use client'

import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { useWalletModal } from '@/components/wallet/WalletModal'
import styles from './wallet.module.css'

export default function WalletPage() {
  const { connected, account, wallet, disconnect } = useWallet()
  const { open } = useWalletModal()

  const address = account?.address?.toString()
  const shortAddress = address
    ? `${address.slice(0, 10)}...${address.slice(-6)}`
    : null

  const copyAddress = () => {
    if (address) navigator.clipboard.writeText(address)
  }

  if (!connected) {
    return (
      <main className={styles.page}>
        <header className={styles.topBar}>
          <h1 className={styles.title}>Wallet</h1>
        </header>
        <div className={styles.connectState}>
          <div className={styles.connectIcon}>⬡</div>
          <h2 className={styles.connectHeading}>Connect your wallet</h2>
          <p className={styles.connectBody}>
            Connect an Aptos wallet to see your balance, earnings, and purchased records.
          </p>
          <div className={styles.walletOptions}>
            <button className={styles.walletOption} onClick={open}>
              <span className={styles.walletOptionIcon}>◈</span>
              <span>Connect Wallet</span>
              <span className={styles.walletOptionArrow}>→</span>
            </button>
          </div>
          <p className={styles.connectNote}>
            New to crypto? Sign in with Google or Apple via Aptos Connect — no extension needed.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <header className={styles.topBar}>
        <h1 className={styles.title}>Wallet</h1>
        <button className={styles.disconnectBtn} onClick={() => disconnect()}>Disconnect</button>
      </header>

      <div className={styles.addressBar}>
        <span className={styles.addressLabel}>CONNECTED · {wallet?.name?.toUpperCase()}</span>
        <span className={styles.address}>{shortAddress}</span>
        <button className={styles.addressCopy} onClick={copyAddress} title="Copy address">⎘</button>
      </div>

      <div className={styles.balanceCard}>
        <div className={styles.balanceRow}>
          <div className={styles.balance}>
            <span className={styles.balanceNum}>—</span>
            <span className={styles.balanceUnit}>APT</span>
          </div>
          <div className={styles.balanceUsd}></div>
        </div>
        <div className={styles.balanceSub}>
          <span>ShelbyUSD: —</span>
          <span>·</span>
          <span>Pending: $0.00</span>
        </div>
        <button className={styles.withdrawBtn}>Withdraw →</button>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statCardNum}>$0.00</span>
          <span className={styles.statCardLabel}>Total earned</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statCardNum}>0</span>
          <span className={styles.statCardLabel}>Licenses sold</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statCardNum}>0</span>
          <span className={styles.statCardLabel}>Total views</span>
        </div>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Recent transactions</h2>
        <div className={styles.txEmpty}>
          <span className={styles.txEmptyIcon}>◈</span>
          <p>No transactions yet</p>
          <p className={styles.txEmptyNote}>Your purchases and earnings will appear here</p>
        </div>
      </section>
    </main>
  )
}
