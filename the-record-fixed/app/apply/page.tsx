import AnnouncementBar from '@/components/layout/AnnouncementBar'
import Nav from '@/components/layout/Nav'
import Footer from '@/components/layout/Footer'
import ApplyForm from '@/components/sections/ApplyForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Apply to Publish — The Record',
  description:
    'Apply to join The Record as an independent journalist. Publish censorship-resistant investigations, get paid directly by readers, and have your work preserved permanently on-chain.',
}

export default function ApplyPage() {
  return (
    <>
      <AnnouncementBar />
      <Nav />
      <main>
        <ApplyForm />
      </main>
      <Footer />
    </>
  )
}
