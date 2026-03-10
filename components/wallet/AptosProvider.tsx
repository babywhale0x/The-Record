'use client'

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react'
import { ReactNode } from 'react'

export default function AptosProvider({ children }: { children: ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappInfo={{
        aptosConnect: {
          dappName: 'The Record',
        },
      }}
      dappConfig={{
  network: 'testnet' as any,
  aptosApiKeys: { testnet: process.env.NEXT_PUBLIC_APTOS_API_KEY },
} as any}
      onError={(error) => {
        console.error('Wallet error:', error)
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  )
}