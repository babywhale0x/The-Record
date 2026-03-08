import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import AnnouncementBar from '@/components/layout/AnnouncementBar'
import Nav from '@/components/layout/Nav'
import Footer from '@/components/layout/Footer'
import ArticlePage from '@/components/investigations/ArticlePage'
import { INVESTIGATIONS } from '@/lib/investigations'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  return INVESTIGATIONS.map((inv) => ({ slug: inv.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = INVESTIGATIONS.find((i) => i.slug === params.slug)
  if (!article) return {}
  return {
    title: `${article.title} — The Record`,
    description: article.excerpt,
  }
}

export default function InvestigationArticlePage({ params }: Props) {
  const article = INVESTIGATIONS.find((i) => i.slug === params.slug)
  if (!article) notFound()

  return (
    <>
      <AnnouncementBar />
      <Nav />
      <main>
        <ArticlePage article={article} />
      </main>
      <Footer />
    </>
  )
}
