'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export type WalletType = 'petra' | 'martian' | 'pontem' | 'aptos-connect' | null

export interface WalletState {
  connected: boolean
  address: string | null
  walletType: WalletType
  aptBalance: number | null
  shelbyBalance: number | null
  connecting: boolean
  error: string | null
}

interface WalletContextValue extends WalletState {
  connect: (type: WalletType) => Promise<void>
  disconnect: () => void
  openConnectModal: () => void
  closeConnectModal: () => void
  isModalOpen: boolean
}

const WalletContext = createContext<WalletContextValue | null>(null)

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}

async function getProvider(walletType: WalletType) {
  if (typeof window === 'undefined') return null
  const w = window as any

  switch (walletType) {
    case 'petra':
      // Petra registers as window.aptos (new) — NOT window.petra
      return w.aptos ?? null
    case 'martian':
      return w.martian ?? null
    case 'pontem':
      return w.pontem ?? null
    default:
      return null
  }
}

async function connectWallet(walletType: WalletType): Promise<string | null> {
  const provider = await getProvider(walletType)
  if (!provider) return null

  // Connect — Petra/Martian/Pontem all follow same pattern
  const connectResult = await provider.connect()

  // Different wallets return address differently
  if (typeof connectResult === 'string') return connectResult
  if (connectResult?.address) {
    // address may be an AccountAddress object with toString()
    const addr = connectResult.address
    return typeof addr === 'string' ? addr : addr?.toString?.() ?? null
  }

  // Some wallets require a separate account() call
  const account = await provider.account()
  if (!account) return null
  if (typeof account === 'string') return account
  const addr = account.address
  return typeof addr === 'string' ? addr : addr?.toString?.() ?? null
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    connected: false,
    address: null,
    walletType: null,
    aptBalance: null,
    shelbyBalance: null,
    connecting: false,
    error: null,
  })
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Restore from localStorage on mount
  if (typeof window !== 'undefined' && !state.connected) {
    const saved = (() => {
      try { return JSON.parse(localStorage.getItem('the-record-wallet') || '') } catch { return null }
    })()
    if (saved?.address && !state.address) {
      // Restore silently — don't block render
      setTimeout(() => {
        setState(s => ({ ...s, connected: true, address: saved.address, walletType: saved.walletType }))
      }, 0)
    }
  }

  const fetchBalances = async (address: string) => {
    try {
      const res = await fetch(`/api/balance?address=${address}`)
      if (res.ok) {
        const data = await res.json()
        setState(s => ({ ...s, aptBalance: data.apt ?? null, shelbyBalance: data.shelbyUsd ?? null }))
      }
    } catch {}
  }

  const connect = useCallback(async (type: WalletType) => {
    if (!type) return
    setState(s => ({ ...s, connecting: true, error: null }))

    // Aptos Connect (social login) — open popup
    if (type === 'aptos-connect') {
      window.open('https://aptosconnect.app', '_blank')
      setState(s => ({
        ...s,
        connecting: false,
        error: null,
      }))
      setIsModalOpen(false)
      return
    }

    try {
      const address = await connectWallet(type)

      if (!address) {
        // Extension not installed
        const installUrls: Record<string, string> = {
          petra: 'https://petra.app',
          martian: 'https://martianwallet.xyz',
          pontem: 'https://pontem.network/pontem-wallet',
        }
        window.open(installUrls[type] || 'https://petra.app', '_blank')
        setState(s => ({
          ...s,
          connecting: false,
          error: `${type} wallet not found. We've opened the install page — install the extension, then try again.`,
        }))
        return
      }

      localStorage.setItem('the-record-wallet', JSON.stringify({ address, walletType: type }))
      setState(s => ({
        ...s, connected: true, address,
        walletType: type, connecting: false, error: null,
      }))
      setIsModalOpen(false)
      fetchBalances(address)
    } catch (err: any) {
      const msg = (err?.message || err?.toString() || '').toLowerCase()
      const rejected = msg.includes('reject') || msg.includes('cancel') || msg.includes('denied') || msg.includes('user')
      setState(s => ({
        ...s,
        connecting: false,
        error: rejected ? 'Connection cancelled.' : `Failed: ${err?.message || 'Please try again.'}`,
      }))
    }
  }, [])

  const disconnect = useCallback(() => {
    localStorage.removeItem('the-record-wallet')
    setState({ connected: false, address: null, walletType: null, aptBalance: null, shelbyBalance: null, connecting: false, error: null })
  }, [])

  const openConnectModal = useCallback(() => setIsModalOpen(true), [])
  const closeConnectModal = useCallback(() => {
    setIsModalOpen(false)
    setState(s => ({ ...s, error: null }))
  }, [])

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect, openConnectModal, closeConnectModal, isModalOpen }}>
      {children}
    </WalletContext.Provider>
  )
}
