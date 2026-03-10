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

async function connectViaWalletStandard(walletName: string): Promise<string | null> {
  if (typeof window === 'undefined') return null
  const w = window as any

  if (walletName === 'petra') {
    // Petra exposes itself as window.aptos (new) or window.petra (legacy)
    const provider = w.aptos || w.petra
    if (!provider) return null
    try {
      // connect() returns { address, publicKey } or similar
      const result = await provider.connect()
      if (result?.address) return result.address
      // some versions return nothing from connect(), need to call account()
      const acc = await provider.account()
      if (typeof acc === 'string') return acc
      if (acc?.address) return acc.address
      return null
    } catch (e) {
      throw e
    }
  }

  if (walletName === 'martian') {
    const provider = w.martian
    if (!provider) return null
    await provider.connect()
    const acc = await provider.account()
    if (typeof acc === 'string') return acc
    return acc?.address || null
  }

  if (walletName === 'pontem') {
    const provider = w.pontem
    if (!provider) return null
    await provider.connect()
    const acc = await provider.account()
    if (typeof acc === 'string') return acc
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
        // Extension not installed — guide them to web.petra.app
        window.open('https://web.petra.app', '_blank')
        setState(s => ({
          ...s,
          connecting: false,
          error: `${type} wallet not found. We've opened Petra's web app — sign in with email or Apple, then come back and click "Connect Wallet" again.`,
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
      const msg = (err?.message || '').toLowerCase()
      const userRejected = msg.includes('reject') || msg.includes('cancel') || msg.includes('denied')
      setState(s => ({
        ...s,
        connecting: false,
        error: userRejected
          ? 'Connection cancelled.'
          : `Connection failed: ${err?.message || 'Please try again.'}`,
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
