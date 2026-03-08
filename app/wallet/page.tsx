'use client'
import { useState } from 'react'
import styles from './wallet.module.css'

export default function WalletPage() {
  const [connected, setConnected] = useState(false)

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
            Connect an Aptos wallet to see your earnings, pay for records, and receive direct payments from readers.
          </p>
          <div className={styles.walletOptions}>
            {['Petra Wallet', 'Martian Wallet', 'Pontem Wallet'].map((w) => (
              <button key={w} className={styles.walletOption} onClick={() => setConnected(true)}>
                <span className={styles.walletOptionIcon}>◈</span>
                <span>{w}</span>
                <span className={styles.walletOptionArrow}>→</span>
              </button>
            ))}
          </div>
          <p className={styles.connectNote}>
            Your wallet address is your identity on The Record. No email. No password.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <header className={styles.topBar}>
        <h1 className={styles.title}>Wallet</h1>
        <button className={styles.disconnectBtn} onClick={() => setConnected(false)}>Disconnect</button>
      </header>

      <div className={styles.addressBar}>
        <span className={styles.addressLabel}>CONNECTED</span>
        <span className={styles.address}>0x3f9a...b44c</span>
        <span className={styles.addressCopy}>⎘</span>
      </div>

      <div className={styles.balanceCard}>
        <div className={styles.balanceRow}>
          <div className={styles.balance}>
            <span className={styles.balanceNum}>12.448</span>
            <span className={styles.balanceUnit}>APT</span>
          </div>
          <div className={styles.balanceUsd}>≈ $74.21 USD</div>
        </div>
        <div className={styles.balanceSub}>
          <span>ShelbyUSD: $8.40</span>
          <span>·</span>
          <span>Pending: $2.10</span>
        </div>
        <button className={styles.withdrawBtn}>Withdraw →</button>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statCardNum}>$142.80</span>
          <span className={styles.statCardLabel}>Total earned</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statCardNum}>203</span>
          <span className={styles.statCardLabel}>Licenses sold</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statCardNum}>14,820</span>
          <span className={styles.statCardLabel}>Total views</span>
        </div>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Recent transactions</h2>
        <div className={styles.txList}>
          {[
            { type: 'License sold', amount: '+$49.00', record: 'Lazarus Bridge Exploit', time: '2h ago', color: 'var(--verified)' },
            { type: 'View purchased', amount: '+$12.00', record: 'Lazarus Bridge Exploit', time: '5h ago', color: 'var(--verified)' },
            { type: 'Storage renewal', amount: '-$0.014', record: 'Shelby Protocol fee', time: '1d ago', color: 'var(--accent)' },
            { type: 'Cite purchased', amount: '+$29.00', record: 'NDDC Shell Companies', time: '2d ago', color: 'var(--verified)' },
          ].map((tx, i) => (
            <div key={i} className={styles.tx}>
              <div className={styles.txLeft}>
                <span className={styles.txType}>{tx.type}</span>
                <span className={styles.txRecord}>{tx.record}</span>
              </div>
              <div className={styles.txRight}>
                <span className={styles.txAmount} style={{ color: tx.color }}>{tx.amount}</span>
                <span className={styles.txTime}>{tx.time}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
