export interface Investigation {
  slug: string
  title: string
  excerpt: string
  author: {
    name: string
    initials: string
    bio: string
    twitter?: string
  }
  publishedAt: string
  readTime: string
  category: string
  accessModel: 'free' | 'pay-per-article' | 'subscription'
  price?: string
  reads: number
  onChain: boolean
  aptosHash: string
  shelbyBlob: string
  body: string
  documents: {
    name: string
    type: string
    hash: string
    source: string
    archivedAt: string
  }[]
  tags: string[]
  featured?: boolean
}

export const INVESTIGATIONS: Investigation[] = [
  {
    slug: 'nddc-4bn-shell-companies',
    title: 'How ₦4.2bn in NDDC contracts were awarded to shell companies linked to the Minister',
    excerpt:
      'A six-month investigation into procurement irregularities at the Niger Delta Development Commission reveals a network of shell companies with direct links to the current Minister\'s family. CAC filings, BPP records, and bank transaction data tell a story of coordinated looting.',
    author: {
      name: 'Fisayo Ogunleye',
      initials: 'FO',
      bio: 'Investigative journalist covering governance and corruption in Nigeria. Previously with Premium Times.',
      twitter: '@fisayoogunleye',
    },
    publishedAt: 'March 5, 2026',
    readTime: '14 min read',
    category: 'Corruption & Accountability',
    accessModel: 'pay-per-article',
    price: '₦500',
    reads: 1204,
    onChain: true,
    aptosHash: '0x4a3fc1d9e8b2f7a6c3d1e9f2b8a4c7d6e1f3a9b2c4d8e7f1a3b6c9d2e5f8a1b4',
    shelbyBlob: 'shelby://blob/nddc-4bn-0x8b2e4f1a',
    body: `The Niger Delta Development Commission, established to develop Nigeria's oil-producing communities, has instead become a vehicle for looting at a scale that staggers the imagination.

Over six months, this investigation obtained and cross-referenced more than 400 procurement documents from the Bureau of Public Procurement, CAC incorporation records for 23 companies, and bank transaction histories obtained through sources inside three commercial banks.

**What we found**

Between January 2024 and October 2024, ₦4.2 billion in NDDC contracts were awarded to seven companies with near-identical incorporation dates, the same registered address — a residential building in Lekki Phase 1 — and directors whose names appear in corporate filings connected to the Minister's eldest son and wife.

The companies, which we are naming for the first time: Goldbridge Construction Ltd, Meridian Works Nigeria, Coastal Infrastructure Partners, Eastern Delta Supplies, Apex Community Contractors Ltd, Riverbed Engineering Services, and United Delta Works — received contracts for road rehabilitation, jetty construction, and community water projects across Bayelsa, Rivers, and Delta states.

Not one of these projects has been completed. Site visits by this reporter to four project locations in December 2024 found either bare land where construction was supposed to have begun, or partially cleared sites with no visible activity.

**The paper trail**

CAC records show Goldbridge Construction Ltd was incorporated on March 3, 2023 — four days before the NDDC issued its first round of contract letters for the 2023-2024 fiscal year. Its sole director is listed as Adaeze Chukwu-Adeleke. A separate CAC filing for a dormant company called Adeleke Family Holdings Ltd, incorporated in 2019, lists the same Adaeze Chukwu-Adeleke as a director alongside the Minister's wife.

The BPP records, which this newspaper obtained through a source inside the commission, show that competitive tendering was waived for five of the seven companies on grounds of "emergency procurement" — a provision that requires ministerial sign-off.

We put detailed questions to the Minister's office two weeks before publication. We received a one-paragraph response denying any conflict of interest and threatening legal action. That response is published in full as a source document attached to this article.`,
    documents: [
      {
        name: 'BPP_Procurement_Awards_NDDC_2024.pdf',
        type: 'pdf',
        hash: 'sha256:8b2e4f1a9c7d3e6b5f2a8c4d1e7b9f3a',
        source: 'Bureau of Public Procurement',
        archivedAt: 'Mar 1, 2026 · 14:22 WAT',
      },
      {
        name: 'CAC_Goldbridge_Construction_Incorporation.pdf',
        type: 'pdf',
        hash: 'sha256:c4d9f2a1b7e3c8f5a2d6b9c1e4f7a3d8',
        source: 'Corporate Affairs Commission',
        archivedAt: 'Mar 1, 2026 · 14:31 WAT',
      },
      {
        name: 'Ministers_Office_Response_Feb2026.pdf',
        type: 'pdf',
        hash: 'sha256:f1a7c3d9b2e6f4a8c1d5e9b3f7a2c6d4',
        source: "Minister's Office (received Feb 19, 2026)",
        archivedAt: 'Feb 19, 2026 · 16:04 WAT',
      },
    ],
    tags: ['NDDC', 'Procurement', 'Shell Companies', 'Niger Delta'],
    featured: true,
  },
  {
    slug: 'inec-rivers-47000-votes',
    title: "INEC's missing 47,000 votes: The Rivers State anomaly nobody is talking about",
    excerpt:
      'Cross-referencing ward-level result sheets with the official INEC portal reveals a 47,000-vote discrepancy in the gubernatorial rerun — and the documents to prove it. The gap appears in exactly the wards where accreditation figures were manually overwritten.',
    author: {
      name: 'Chisom Nwosu',
      initials: 'CN',
      bio: 'Data journalist and elections analyst. Covers electoral integrity across West Africa.',
      twitter: '@chisomdata',
    },
    publishedAt: 'February 18, 2026',
    readTime: '11 min read',
    category: 'Politics & Governance',
    accessModel: 'subscription',
    reads: 3891,
    onChain: true,
    aptosHash: '0x9d1f4b8a2c7e3f6b5a9d2c4f1b8e6a3d9c2f7b4e1a6d3c8f5b2e9a4d7c1f6b3',
    shelbyBlob: 'shelby://blob/inec-rivers-0x9d1f4b',
    body: `In the weeks following the Rivers State gubernatorial election rerun of November 2025, official results were certified and a winner was declared. INEC closed the process. The courts have since affirmed the outcome.

But the numbers don't add up.

**The methodology**

Using ward-level result sheets obtained from INEC's public results portal — documents that are technically public but require knowing exactly which directories to query — this reporter compiled accreditation and vote totals for all 319 electoral wards in Rivers State.

The official portal shows a statewide accreditation figure of 1,247,803. The sum of the 319 individual ward sheets: 1,200,631. The difference: 47,172 votes.

This is not rounding error. These are discrete documents with discrete numbers that do not reconcile.

**Where the gap appears**

The discrepancy is not evenly distributed. It concentrates in 22 wards across three local government areas: Obio-Akpor, Port Harcourt, and Ikwerre. In each of these wards, the result sheet image on the portal shows accreditation figures that appear to have been written over — a lighter ink beneath a darker overwrite is visible when the PDF is examined at high resolution.

We are attaching the original INEC ward sheets as source documents. We are also attaching a side-by-side comparison showing the pixel-level analysis of the overwritten figures in Ward 003, Obio-Akpor LGA.`,
    documents: [
      {
        name: 'INEC_Rivers_Ward_Results_AllWards_Nov2025.csv',
        type: 'csv',
        hash: 'sha256:a3f8d2c1b9e7a4f6c2d8b3e1f9a5c7d4',
        source: 'INEC Results Portal (archived Nov 29, 2025)',
        archivedAt: 'Nov 29, 2025 · 22:17 WAT',
      },
      {
        name: 'ObioAkpor_Ward003_ResultSheet_HighRes.pdf',
        type: 'pdf',
        hash: 'sha256:d7b4f1a9c3e8f2b6a1d4c9f7b3e6a2d8',
        source: 'INEC Portal — Ward 003, Obio-Akpor',
        archivedAt: 'Nov 30, 2025 · 09:41 WAT',
      },
    ],
    tags: ['INEC', 'Elections', 'Rivers State', 'Data Analysis'],
    featured: true,
  },
  {
    slug: 'cbn-forex-directive-connected-banks',
    title: 'The CBN forex directive that enriched five connected banks — and nobody reported it',
    excerpt:
      'A December 2024 circular from the Central Bank quietly changed the rules on domiciliary account withdrawals in a way that exclusively benefited five tier-2 banks. Three of their chairmen attended the same CBN retreat two weeks earlier.',
    author: {
      name: 'Obinna Eze',
      initials: 'OE',
      bio: 'Financial journalist covering CBN policy, banking, and capital markets.',
    },
    publishedAt: 'January 30, 2026',
    readTime: '9 min read',
    category: 'Business & Finance',
    accessModel: 'pay-per-article',
    price: '₦800',
    reads: 892,
    onChain: true,
    aptosHash: '0x2c8f5b1e9a4d7c3f6b2e8a5d1c9f4b7e3a6d2c8f5b1e9a4d7c3f6b2e8a5d1c9',
    shelbyBlob: 'shelby://blob/cbn-forex-0x2c8f5b',
    body: `On December 14, 2024, the Central Bank of Nigeria issued Circular FPR/DIR/GEN/CIR/07/020, amending withdrawal limits for domiciliary accounts at commercial banks.

The circular, which runs to four pages and is available as a source document attached to this article, introduced a tiered system for foreign currency withdrawals based on a bank's "forex liquidity ratio" — a metric that, until this circular, did not exist in CBN regulation.

What the circular did not explain is how this ratio would be calculated, who would calculate it, or when it would be published. What became clear within weeks was which banks had it.`,
    documents: [
      {
        name: 'CBN_Circular_FPR_DIR_GEN_CIR_07_020_Dec2024.pdf',
        type: 'pdf',
        hash: 'sha256:b6e3f9a2c8d4b1f7a3e6c9d2b8f4a7c3',
        source: 'CBN Official Website (archived Dec 15, 2024)',
        archivedAt: 'Dec 15, 2024 · 08:33 WAT',
      },
    ],
    tags: ['CBN', 'Forex', 'Banking', 'Financial Policy'],
    featured: false,
  },
  {
    slug: 'military-land-grabbing-abuja',
    title: 'How army officers used Ministry of Defence letterheads to seize 40 hectares of Abuja farmland',
    excerpt:
      'Families who farmed land in Bwari Area Council for three generations received eviction notices on Ministry of Defence letterhead. The land now hosts a private estate. The officers who signed the letters don\'t appear in any official military registry.',
    author: {
      name: 'Amaka Obi',
      initials: 'AO',
      bio: 'Human rights reporter. Covers land rights, displacement, and security sector accountability.',
      twitter: '@amakareports',
    },
    publishedAt: 'January 12, 2026',
    readTime: '16 min read',
    category: 'Human Rights',
    accessModel: 'free',
    reads: 5621,
    onChain: true,
    aptosHash: '0x7f3a9c2e5b8d1f4a7c3e6b9f2a5d8c1e4f7b3a6c9d2e5f8b1a4c7d3e6f9b2a5',
    shelbyBlob: 'shelby://blob/military-land-0x7f3a9c',
    body: `Musa Garba is 71 years old. His father farmed the same plot of land in Bwari Area Council. His grandfather is buried there.

In October 2023, a man arrived at his compound with a letter on Ministry of Defence letterhead informing him that the land had been "requisitioned for national security purposes" and that he had 14 days to vacate.

Garba is one of 34 families who received identical letters. None of them have received compensation. All of them have been displaced. On the land where their farms and homes stood, construction of a private estate called "Generals' Court" — a name visible on hoarding boards around the site — began in January 2024.`,
    documents: [
      {
        name: 'Eviction_Notice_MOD_Letterhead_Oct2023.pdf',
        type: 'pdf',
        hash: 'sha256:e2a7f4c9b3d6a1f8c4e7b2d9a6f3c8e1',
        source: 'Obtained from Musa Garba (verified original)',
        archivedAt: 'Jan 5, 2026 · 11:14 WAT',
      },
      {
        name: 'Land_Registry_Bwari_Historical_Ownership.pdf',
        type: 'pdf',
        hash: 'sha256:c9f2b7e4a1d8c5f3b9e6a2d7c4f1b8e5',
        source: 'FCT Land Registry',
        archivedAt: 'Jan 6, 2026 · 09:52 WAT',
      },
    ],
    tags: ['Military', 'Land Rights', 'Abuja', 'Displacement'],
    featured: false,
  },
]
