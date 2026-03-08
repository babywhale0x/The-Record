import type { Metadata } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'The Record — Permanent. Verified. Yours.',
  description:
    'Censorship-resistant publishing and document verification for independent journalists in Nigeria and West Africa. Built on Shelby Protocol and Aptos.',
  openGraph: {
    title: 'The Record',
    description: 'Your story. Permanent. Verified. Yours.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
