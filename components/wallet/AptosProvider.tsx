'use client'

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react'
import { Network } from '@aptos-labs/ts-sdk'
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
        network: Network.TESTNET,
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
