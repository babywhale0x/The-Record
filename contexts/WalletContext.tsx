'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

export type WalletType = 'petra' | 'martian' | 'pontem' | null

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

// Aptos Wallet Standard — works with Petra, Martian, Pontem via AIP-62
async function connectViaWalletStandard(walletName: string) {
  if (typeof window === 'undefined') return null

  // AIP-62: wallets register themselves in window.aptos or via the wallet standard event
  const w = window as any

  // Try wallet standard first (new Petra uses this)
  if (w.aptosWallets) {
    const wallets: any[] = w.aptosWallets.get ? w.aptosWallets.get() : []
    const wallet = wallets.find((wlt: any) =>
      wlt.name?.toLowerCase().includes(walletName.toLowerCase())
    )
    if (wallet) {
      const response = await wallet.features['aptos:connect'].connect()
      return response?.address || response?.account?.address || null
    }
  }

  // Fallback: wallet-specific globals (Martian, Pontem still use these)
  if (walletName === 'martian' && w.martian) {
    await w.martian.connect()
    const acc = await w.martian.account()
    return acc?.address || null
  }

  if (walletName === 'pontem' && w.pontem) {
    await w.pontem.connect()
    const acc = await w.pontem.account()
    return acc?.address || null
  }

  // Petra new standard
  if (walletName === 'petra' && w.aptos) {
    await w.aptos.connect()
    const acc = await w.aptos.account()
    return acc?.address || null
  }

  return null
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

  useEffect(() => {
    const saved = localStorage.getItem('the-record-wallet')
    if (saved) {
      try {
        const { address, walletType } = JSON.parse(saved)
        if (address && walletType) {
          setState(s => ({ ...s, connected: true, address, walletType }))
          fetchBalances(address)
        }
      } catch {}
    }
  }, [])

  const fetchBalances = async (address: string) => {
    try {
      const res = await fetch(`/api/balance?address=${address}`)
      if (res.ok) {
        const data = await res.json()
        setState(s => ({
          ...s,
          aptBalance: data.apt ?? null,
          shelbyBalance: data.shelbyUsd ?? null,
        }))
      }
    } catch {}
  }

  const connect = useCallback(async (type: WalletType) => {
    if (!type) return
    setState(s => ({ ...s, connecting: true, error: null }))

    try {
      const address = await connectViaWalletStandard(type)

      if (!address) {
        // Extension not found — open Petra web for social signup
        window.open('https://web.petra.app', '_blank')
        setState(s => ({
          ...s,
          connecting: false,
          error: `${type} wallet extension not found. We've opened Petra's web app — sign in there with email or Apple, then come back and click "Connect Wallet" again.`,
        }))
        return
      }

      localStorage.setItem('the-record-wallet', JSON.stringify({ address, walletType: type }))
      setState(s => ({
        ...s,
        connected: true,
        address,
        walletType: type,
        connecting: false,
        error: null,
      }))
      setIsModalOpen(false)
      fetchBalances(address)
    } catch (err: any) {
      const msg = err?.message || ''
      const userRejected = msg.toLowerCase().includes('rejected') || msg.toLowerCase().includes('cancel')
      setState(s => ({
        ...s,
        connecting: false,
        error: userRejected ? 'Connection cancelled.' : 'Connection failed. Please try again.',
      }))
    }
  }, [])

  const disconnect = useCallback(() => {
    localStorage.removeItem('the-record-wallet')
    setState({
      connected: false,
      address: null,
      walletType: null,
      aptBalance: null,
      shelbyBalance: null,
      connecting: false,
      error: null,
    })
  }, [])

  const openConnectModal = useCallback(() => setIsModalOpen(true), [])
  const closeConnectModal = useCallback(() => {
    setIsModalOpen(false)
    setState(s => ({ ...s, error: null }))
  }, [])

  return (
    <WalletContext.Provider value={{
      ...state,
      connect,
      disconnect,
      openConnectModal,
      closeConnectModal,
      isModalOpen,
    }}>
      {children}
    </WalletContext.Provider>
  )
}
