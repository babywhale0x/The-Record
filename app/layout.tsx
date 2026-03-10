import type { Metadata, Viewport } from 'next'
import '../styles/globals.css'
import BottomNav from '@/components/layout/BottomNav'
import TopBar from '@/components/layout/TopBar'
import AptosProvider from '@/components/wallet/AptosProvider'
import WalletModal, { WalletModalProvider } from '@/components/wallet/WalletModal'

export const metadata: Metadata = {
  title: 'The Record — Permanent. Verified. On-Chain.',
  description:
    'A permanent, verifiable knowledge archive. Publish investigations, research, legal documents, and on-chain analysis. Every record cryptographically committed to Aptos.',
  openGraph: {
    title: 'The Record',
    description: 'Permanent. Verified. On-Chain.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A0A0A',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AptosProvider>
          <WalletModalProvider>
            <TopBar />
            <div style={{ paddingTop: 'var(--top-bar-h)' }}>
              {children}
            </div>
            <BottomNav />
            <WalletModal />
          </WalletModalProvider>
        </AptosProvider>
      </body>
    </html>
  )
}
