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

function getWalletProvider(type: WalletType) {
  if (typeof window === 'undefined') return null
  const w = window as any
  if (type === 'petra') return w.petra || w.aptos || null
  if (type === 'martian') return w.martian || null
  if (type === 'pontem') return w.pontem || null
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

  // Restore session from localStorage
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
      const provider = getWalletProvider(type)

      if (!provider) {
        // Wallet extension not installed — open web.petra.app for social signup
        window.open('https://web.petra.app', '_blank')
        setState(s => ({
          ...s,
          connecting: false,
          error: `${type} wallet not found. We've opened Petra's web app where you can sign in with email or Apple.`,
        }))
        return
      }

      let account: { address: string } | null = null

      if (type === 'petra') {
        await provider.connect()
        account = await provider.account()
      } else if (type === 'martian') {
        await provider.connect()
        account = await provider.account()
      } else if (type === 'pontem') {
        await provider.connect()
        account = await provider.account()
      }

      if (!account?.address) throw new Error('No account returned')

      const address = account.address
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
      setState(s => ({
        ...s,
        connecting: false,
        error: err?.message || 'Connection failed. Please try again.',
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
