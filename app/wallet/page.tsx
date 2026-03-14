'use client'
import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { useWalletModal } from '@/components/wallet/WalletModal'
import styles from './wallet.module.css'

interface BalanceData {
  apt: number
  shelbyUsd: number
}

interface Transaction {
  hash: string
  type: 'sent' | 'received'
  amount: number
  counterparty: string
  timestamp: number
  success: boolean
}

interface EarningsData {
  totalRecords: number
  totalEarned: number
  recentRecords: { slug: string; title: string; created_at: string }[]
}

export default function WalletPage() {
  const { connected, account, wallet, disconnect } = useWallet()
  const { open } = useWalletModal()
  const [balance, setBalance] = useState<BalanceData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [earnings, setEarnings] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const address = account?.address ? String(account.address) : undefined
  const shortAddress = address ? `${String(address).slice(0, 10)}…${String(address).slice(-6)}` : null

  const fetchBalance = useCallback(async () => {
    if (!address) return
    try {
      const res = await fetch(`/api/balance?address=${address}`)
      const data = await res.json()
      if (data.apt !== undefined) setBalance({ apt: data.apt, shelbyUsd: data.shelbyUsd || 0 })
    } catch {}
  }, [address])

  const fetchTransactions = useCallback(async () => {
    if (!address) return
    try {
      const apiKey = process.env.NEXT_PUBLIC_APTOS_API_KEY || ''
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

      const res = await fetch(
        `https://api.testnet.aptoslabs.com/v1/accounts/${address}/transactions?limit=20`,
        { headers }
      )
      if (!res.ok) return
      const txns = await res.json()

      const parsed: Transaction[] = txns
        .filter((t: any) => t.type === 'user_transaction')
        .map((t: any) => {
          const payload = t.payload || {}
          const args = payload.arguments || []
          const fn = payload.function || ''
          const isCoinTransfer = fn.includes('coin::transfer') || fn.includes('aptos_account::transfer')
          const amount = isCoinTransfer && args[1] ? parseInt(args[1]) / 1e8 : 0
          const to = isCoinTransfer && args[0] ? args[0] : ''
          const isOutgoing = t.sender === address

          return {
            hash: t.hash,
            type: isOutgoing ? 'sent' : 'received',
            amount,
            counterparty: isOutgoing ? to : t.sender,
            timestamp: Math.floor(parseInt(t.timestamp) / 1000),
            success: t.success,
          }
        })
        .filter((t: Transaction) => t.amount > 0)

      setTransactions(parsed)
    } catch {}
  }, [address])

  const fetchEarnings = useCallback(async () => {
    if (!address) return
    try {
      const res = await fetch(`/api/dashboard/records?address=${address}`)
      const data = await res.json()
      if (data.records) {
        setEarnings({
          totalRecords: data.records.length,
          totalEarned: 0, // TODO: sum from licenses table
          recentRecords: data.records.slice(0, 3),
        })
      }
    } catch {}
  }, [address])

  useEffect(() => {
    if (!connected || !address) return
    setLoading(true)
    Promise.all([fetchBalance(), fetchTransactions(), fetchEarnings()])
      .finally(() => setLoading(false))
  }, [connected, address])

  const copyAddress = async () => {
    if (!address) return
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatApt = (n: number) => parseFloat(n.toFixed(4)).toString()
  const formatDate = (ts: number) => new Date(ts).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })
  const shortAddr = (a: any) => { const s = String(a || ''); return s.length > 12 ? `${s.slice(0, 8)}…${s.slice(-4)}` : s || '—' }

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
            Connect an Aptos wallet to see your balance, earnings, and transaction history.
          </p>
          <button className={styles.walletOption} onClick={open}>
            <span className={styles.walletOptionIcon}>◈</span>
            <span>Connect Wallet</span>
            <span className={styles.walletOptionArrow}>→</span>
          </button>
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

      {/* Address bar */}
      <div className={styles.addressBar}>
        <span className={styles.addressLabel}>CONNECTED · {wallet?.name?.toUpperCase()}</span>
        <span className={styles.address}>{shortAddress}</span>
        <button className={styles.addressCopy} onClick={copyAddress} title="Copy address">
          {copied ? '✓' : '⎘'}
        </button>
      </div>

      {/* Balance card */}
      <div className={styles.balanceCard}>
        <div className={styles.balanceRow}>
          <div className={styles.balance}>
            <span className={styles.balanceNum}>
              {loading ? '…' : balance ? formatApt(balance.apt) : '—'}
            </span>
            <span className={styles.balanceUnit}>APT</span>
          </div>
          <button className={styles.refreshBtn} onClick={() => { fetchBalance(); fetchTransactions() }} title="Refresh">
            ↻
          </button>
        </div>
        <div className={styles.balanceSub}>
          <span>Network: Testnet</span>
          <span>·</span>
          <span>
            <a
              href={`https://explorer.aptoslabs.com/account/${address}?network=testnet`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.explorerLink}
            >
              View on Explorer ↗
            </a>
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statCardNum}>{earnings?.totalRecords ?? '—'}</span>
          <span className={styles.statCardLabel}>Records published</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statCardNum}>{transactions.filter(t => t.type === 'received').length}</span>
          <span className={styles.statCardLabel}>Payments received</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statCardNum}>
            {formatApt(transactions.filter(t => t.type === 'received').reduce((s, t) => s + t.amount, 0))}
          </span>
          <span className={styles.statCardLabel}>APT earned</span>
        </div>
      </div>

      {/* Published records */}
      {earnings?.recentRecords && earnings.recentRecords.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Your records</h2>
          <div className={styles.recordsList}>
            {earnings.recentRecords.map((r) => (
              <a key={r.slug} href={`/records/${r.slug}`} className={styles.recordRow}>
                <span className={styles.recordTitle}>{r.title}</span>
                <span className={styles.recordDate}>
                  {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className={styles.recordArrow}>→</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Transactions */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Recent transactions</h2>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</p>
        ) : transactions.length === 0 ? (
          <div className={styles.txEmpty}>
            <span className={styles.txEmptyIcon}>◈</span>
            <p>No transactions yet</p>
            <p className={styles.txEmptyNote}>Your purchases and earnings will appear here</p>
          </div>
        ) : (
          <div className={styles.txList}>
            {transactions.map((tx) => (
              <a
                key={tx.hash}
                href={`https://explorer.aptoslabs.com/txn/${tx.hash}?network=testnet`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.txRow}
              >
                <div className={`${styles.txIcon} ${tx.type === 'received' ? styles.txIconIn : styles.txIconOut}`}>
                  {tx.type === 'received' ? '↓' : '↑'}
                </div>
                <div className={styles.txInfo}>
                  <span className={styles.txType}>
                    {tx.type === 'received' ? 'Received from' : 'Sent to'} {shortAddr(tx.counterparty)}
                  </span>
                  <span className={styles.txDate}>{formatDate(tx.timestamp)}</span>
                </div>
                <div className={styles.txAmount}>
                  <span className={`${styles.txAmountNum} ${tx.type === 'received' ? styles.txAmountIn : styles.txAmountOut}`}>
                    {tx.type === 'received' ? '+' : '-'}{formatApt(tx.amount)} APT
                  </span>
                  {!tx.success && <span className={styles.txFailed}>FAILED</span>}
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
