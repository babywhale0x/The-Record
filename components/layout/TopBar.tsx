'use client'

import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { useWalletModal } from '@/components/wallet/WalletModal'
import styles from './TopBar.module.css'

export default function TopBar() {
  const { connected, account, disconnect } = useWallet()
  const { open } = useWalletModal()

  const shortAddress = account?.address
    ? `${account.address.toString().slice(0, 6)}...${account.address.toString().slice(-4)}`
    : null

  return (
    <div className={styles.bar}>
      <span className={styles.logo}>The Record</span>
      {connected ? (
        <div className={styles.connected}>
          <span className={styles.dot} />
          <span className={styles.address}>{shortAddress}</span>
          <button className={styles.disconnectBtn} onClick={() => disconnect()}>✕</button>
        </div>
      ) : (
        <button className={styles.connectBtn} onClick={open}>
          Connect Wallet
        </button>
      )}
    </div>
  )
}
