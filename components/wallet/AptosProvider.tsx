'use client'

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react'
import { ReactNode } from 'react'

export default function AptosProvider({ children }: { children: ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={{
        network: 'testnet' as any,
        aptosConnectDappId: 'the-record-dapp',
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
