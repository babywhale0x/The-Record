'use client'

// This is now a thin wrapper around @aptos-labs/wallet-adapter-react
// Re-exports everything our app needs from the official adapter
export { useWallet } from '@aptos-labs/wallet-adapter-react'
export type { WalletName } from '@aptos-labs/wallet-adapter-react'
