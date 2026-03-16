'use client'

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react'
import { ReactNode } from 'react'

export default function AptosProvider({ children }: { children: ReactNode }) {
  const aptosConnectDappId = process.env.NEXT_PUBLIC_APTOS_CONNECT_DAPP_ID
  const network = (process.env.NEXT_PUBLIC_APTOS_NETWORK || 'testnet') as any

  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      autoConnect={false}
      dappConfig={{
        network: 'testnet' as any,
        aptosConnectDappId: 'the-record-dapp',
        network,
        aptosConnectDappId,
        mizuwallet: {
          manifestURL: 'https://assets.mz.xyz/static/config/mizuwallet-connect-manifest.json',
        },
      }}
      onError={(error) => {
        console.error('Wallet error:', error)
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  )
}