'use client'

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react'
import { ReactNode } from 'react'

export default function AptosProvider({ children }: { children: ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      optInWallets={['Petra', 'Martian', 'Pontem Wallet']}
      dappInfo={{
        aptosConnect: {
          dappName: 'The Record',
        },
      }}
      dappConfig={{
        network: 'testnet' as any,
        aptosApiKey: process.env.NEXT_PUBLIC_APTOS_API_KEY,
      }}
      onError={(error) => {
        console.error('Wallet error:', error)
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  )
}