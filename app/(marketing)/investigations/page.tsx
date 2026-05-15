import type { Metadata } from 'next'
import InvestigationsFeed from '@/components/investigations/InvestigationsFeed'

export const metadata: Metadata = {
  title: 'Investigations — The Record',
  description:
    'Censorship-resistant investigative journalism from Nigeria and West Africa. Every article permanently archived. Every source document verified on-chain.',
}

export default function InvestigationsPage() {
  return <InvestigationsFeed />
}
