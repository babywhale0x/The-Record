'use client'

import { useWallet } from '@/contexts/WalletContext'
import styles from './TopBar.module.css'

export default function TopBar() {
  const { connected, address, openConnectModal, disconnect } = useWallet()

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null

  return (
    <div className={styles.bar}>
      <span className={styles.logo}>The Record</span>
      {connected ? (
        <div className={styles.connected}>
          <span className={styles.dot} />
          <span className={styles.address}>{shortAddress}</span>
          <button className={styles.disconnectBtn} onClick={disconnect}>✕</button>
        </div>
      ) : (
        <button className={styles.connectBtn} onClick={openConnectModal}>
          Connect Wallet
        </button>
      )}
    </div>
  )
}
