'use client'

import { useWallet } from '@/contexts/WalletContext'
import styles from './wallet.module.css'

export default function WalletPage() {
  const {
    connected, address, walletType,
    aptBalance, shelbyBalance,
    openConnectModal, disconnect
  } = useWallet()

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
            <button className={styles.walletOption} onClick={openConnectModal}>
              <span className={styles.walletOptionIcon}>◈</span>
              <span>Connect Wallet</span>
              <span className={styles.walletOptionArrow}>→</span>
            </button>
            <button
              className={`${styles.walletOption} ${styles.walletOptionSocial}`}
              onClick={() => window.open('https://web.petra.app', '_blank')}
            >
              <span className={styles.walletOptionIcon}>↗</span>
              <span>Sign in with email or Apple</span>
              <span className={styles.walletOptionArrow}>↗</span>
            </button>
          </div>
          <p className={styles.connectNote}>
            New to crypto? Use Petra's web app to create a wallet with just your email or Apple account.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <header className={styles.topBar}>
        <h1 className={styles.title}>Wallet</h1>
        <button className={styles.disconnectBtn} onClick={disconnect}>Disconnect</button>
      </header>

      <div className={styles.addressBar}>
        <span className={styles.addressLabel}>CONNECTED · {walletType?.toUpperCase()}</span>
        <span className={styles.address}>{shortAddress}</span>
        <button className={styles.addressCopy} onClick={copyAddress} title="Copy address">⎘</button>
      </div>

      <div className={styles.balanceCard}>
        <div className={styles.balanceRow}>
          <div className={styles.balance}>
            <span className={styles.balanceNum}>
              {aptBalance !== null ? aptBalance.toFixed(3) : '—'}
            </span>
            <span className={styles.balanceUnit}>APT</span>
          </div>
          <div className={styles.balanceUsd}>
            {aptBalance !== null ? `≈ $${(aptBalance * 5.96).toFixed(2)} USD` : ''}
          </div>
        </div>
        <div className={styles.balanceSub}>
          <span>ShelbyUSD: {shelbyBalance !== null ? `$${shelbyBalance.toFixed(2)}` : '—'}</span>
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
