import AnnouncementBar from '@/components/layout/AnnouncementBar'
import Nav from '@/components/layout/Nav'
import Footer from '@/components/layout/Footer'
import Hero from '@/components/sections/Hero'
import HowItWorks from '@/components/sections/HowItWorks'
import ForJournalists from '@/components/sections/ForJournalists'
import ForReaders from '@/components/sections/ForReaders'
import ArchiveSection from '@/components/sections/ArchiveSection'
import BuiltOn from '@/components/sections/BuiltOn'
import CTASection from '@/components/sections/CTASection'

export default function HomePage() {
  return (
    <>
      <AnnouncementBar />
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <ForJournalists />
        <ForReaders />
        <ArchiveSection />
        <BuiltOn />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
