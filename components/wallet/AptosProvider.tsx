'use client'

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react'
import { ReactNode } from 'react'

export default function AptosProvider({ children }: { children: ReactNode }) {
  const aptosConnectDappId = process.env.NEXT_PUBLIC_APTOS_CONNECT_DAPP_ID
  const network = (process.env.NEXT_PUBLIC_APTOS_NETWORK || 'testnet') as 'testnet' | 'mainnet' | 'devnet'

  const dappConfig = {
    network,
    mizuwallet: {
      manifestURL: 'https://assets.mz.xyz/static/config/mizuwallet-connect-manifest.json',
    },
    ...(aptosConnectDappId ? { aptosConnectDappId } : {}),
  }

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
      autoConnect={false}
      dappConfig={dappConfig}
      onError={(error) => {
        console.error('Wallet error:', error)
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  )
}