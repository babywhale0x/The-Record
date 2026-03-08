/**
 * lib/records.ts
 * Mock record data for the platform.
 * Replace with real Supabase queries once live.
 */

import type { ContentType, LicenseTier } from './content-types'

export interface SourceDoc {
  id: string
  name: string
  type: string
  shelbyBlobName: string
  aptosTxHash: string
  contentHash: string
  sizeKb: number
}

export interface Record {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string
  contentType: ContentType
  publisherName: string
  publisherHandle: string
  publisherVerified: boolean
  publishedAt: string
  tags: string[]
  aptosTxHash: string
  blockHash: string
  shelbyBlobName: string
  viewCount: number
  licenseCount: number
  basePriceUsd: number
  tiers: {
    view: number
    cite: number
    license: number
  }
  sourceDocs: SourceDoc[]
  featured: boolean
}

export const RECORDS: Record[] = [
  {
    id: '1',
    slug: 'lazarus-group-2024-bridge-exploit',
    title: 'Lazarus Group 2024 Bridge Exploit: Full Fund Flow Analysis',
    excerpt: 'Complete on-chain trace of $62M extracted via the Ronin bridge exploit variant. 847 wallet hops across 6 chains mapped to known Lazarus staging addresses.',
    body: `## Executive Summary

The exploit occurred at block 19,847,221 on Ethereum mainnet. The attacker used a previously undisclosed validator key compromise to authorize fraudulent withdrawals totalling $62,441,000 in ETH and USDC.

## Fund Flow

Initial extraction came from the bridge contract at 0x...3f91. Funds were immediately split across three intermediary wallets and bridged to BSC within 4 blocks — suggesting pre-staged infrastructure.

## Lazarus Attribution

Cross-referencing staging wallet 0x...b44c against OFAC-listed addresses confirms a 94% match with known Lazarus Group fund movement patterns: Tornado Cash → fixed-size hops → OTC offramp. The pattern is identical to the 2022 Harmony bridge exploit.`,
    contentType: 'on-chain',
    publisherName: 'ZachOnChain',
    publisherHandle: 'zachonchain',
    publisherVerified: true,
    publishedAt: '2024-11-14T09:22:00Z',
    tags: ['lazarus', 'bridge-exploit', 'fund-flow', 'north-korea', 'defi'],
    aptosTxHash: '0x8f3a9c2b1d4e7f6a0c8b5d2e9f3a1c4b7d0e6f2a',
    blockHash: '0x1a2b3c4d5e6f7a8b',
    shelbyBlobName: 'record-lazarus-bridge-2024-v1',
    viewCount: 14820,
    licenseCount: 203,
    basePriceUsd: 12,
    tiers: { view: 12, cite: 49, license: 199 },
    sourceDocs: [
      { id: 's1', name: 'wallet-hop-graph.json', type: 'application/json', shelbyBlobName: 'doc-lazarus-hop-graph', aptosTxHash: '0xabc...', contentHash: 'sha256:def...', sizeKb: 840 },
      { id: 's2', name: 'lazarus-ofac-crossref.csv', type: 'text/csv', shelbyBlobName: 'doc-lazarus-ofac', aptosTxHash: '0xdef...', contentHash: 'sha256:abc...', sizeKb: 212 },
    ],
    featured: true,
  },
  {
    id: '2',
    slug: 'nddc-4bn-shell-companies-2024',
    title: 'NDDC ₦4.2 Billion: How Shell Companies Received Federal Contracts',
    excerpt: 'BPP procurement records cross-referenced against CAC filings reveal 14 contractors with no physical address, no employees, and no prior federal work received ₦4.2bn in NDDC contracts over 18 months.',
    body: `## The Pattern

Between January 2023 and June 2024, fourteen companies received contracts totalling ₦4,217,000,000 from the Niger Delta Development Commission. All fourteen were registered within 90 days of receiving their first award.

## The Evidence

CAC filings obtained via FOIA show each company lists the same two directors and a residential address in Abuja's Wuse 2. None have staff, none have filed tax returns, none existed before the contracts.

## The BPP Records

Bureau of Public Procurement award notices — archived on The Record — show no competitive tender process was followed for eleven of the fourteen contracts.`,
    contentType: 'investigation',
    publisherName: 'Fisayo Soyombo',
    publisherHandle: 'fisayosoyombo',
    publisherVerified: true,
    publishedAt: '2024-10-28T07:15:00Z',
    tags: ['nddc', 'corruption', 'procurement', 'nigeria', 'shell-companies'],
    aptosTxHash: '0x9b2c4d6e8f1a3b5c7d9e0f2a4b6c8d0e1f3a5b7c',
    blockHash: '0x2b3c4d5e6f7a8b9c',
    shelbyBlobName: 'record-nddc-4bn-2024-v1',
    viewCount: 9340,
    licenseCount: 87,
    basePriceUsd: 8,
    tiers: { view: 8, cite: 29, license: 149 },
    sourceDocs: [
      { id: 's3', name: 'bpp-award-notices-2023-2024.pdf', type: 'application/pdf', shelbyBlobName: 'doc-nddc-bpp', aptosTxHash: '0x...', contentHash: 'sha256:...', sizeKb: 4210 },
      { id: 's4', name: 'cac-company-filings.pdf', type: 'application/pdf', shelbyBlobName: 'doc-nddc-cac', aptosTxHash: '0x...', contentHash: 'sha256:...', sizeKb: 1870 },
    ],
    featured: true,
  },
  {
    id: '3',
    slug: 'tornado-cash-sanctions-evasion-2024',
    title: 'Post-Sanctions Tornado Cash: New Deployment Analysis',
    excerpt: 'The original Tornado Cash contracts at 0x...a1b remain active. New deployment at 0x...f9c processed $840M in the 90 days following OFAC sanctions. Full relay infrastructure mapped.',
    body: `## New Contract Analysis

Despite OFAC sanctions, a new Tornado Cash deployment at 0xf9c...441 went live November 2023. Our analysis of 90 days of transaction data shows $840M processed — largely indistinguishable from the sanctioned deployment.

## Relay Infrastructure

The relay network operates via 14 known relayers. We identified 9 by cross-referencing ENS names with GitHub commits to the tornado-cash-relayer repository.`,
    contentType: 'on-chain',
    publisherName: 'ChainAnalyst',
    publisherHandle: 'chainanalyst',
    publisherVerified: true,
    publishedAt: '2024-11-01T11:00:00Z',
    tags: ['tornado-cash', 'sanctions', 'ofac', 'privacy', 'defi'],
    aptosTxHash: '0x3c5d7e9f1a2b4c6d8e0f1a3b5c7d9e0f2a4b6c8d',
    blockHash: '0x3c4d5e6f7a8b9c0d',
    shelbyBlobName: 'record-tornado-2024-v1',
    viewCount: 6210,
    licenseCount: 44,
    basePriceUsd: 15,
    tiers: { view: 15, cite: 59, license: 249 },
    sourceDocs: [],
    featured: false,
  },
  {
    id: '4',
    slug: 'court-order-inec-2023-presidential',
    title: 'INEC Presidential Election Materials: Full FOIA Release',
    excerpt: 'Court-ordered release of INEC\'s internal communications, BVAS configuration logs, and result transmission audit trails from the 2023 presidential election.',
    body: `## Background

Following a court order in Suit No. FHC/ABJ/CS/228/2023, INEC released 2,847 pages of internal documents related to the February 25, 2023 presidential election.

## What the Documents Show

BVAS configuration logs reveal 1,441 polling units transmitted results more than 48 hours after polls closed — inconsistent with INEC's own reporting of near-real-time transmission.`,
    contentType: 'legal',
    publisherName: 'LegalArchive NG',
    publisherHandle: 'legalarchiveng',
    publisherVerified: true,
    publishedAt: '2024-09-12T14:30:00Z',
    tags: ['inec', 'election', '2023', 'foia', 'nigeria', 'court-order'],
    aptosTxHash: '0x4d6e8f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e',
    blockHash: '0x4d5e6f7a8b9c0d1e',
    shelbyBlobName: 'record-inec-foia-2023-v1',
    viewCount: 22100,
    licenseCount: 341,
    basePriceUsd: 5,
    tiers: { view: 5, cite: 19, license: 99 },
    sourceDocs: [
      { id: 's5', name: 'inec-bvas-config-logs.pdf', type: 'application/pdf', shelbyBlobName: 'doc-inec-bvas', aptosTxHash: '0x...', contentHash: 'sha256:...', sizeKb: 18400 },
    ],
    featured: true,
  },
  {
    id: '5',
    slug: 'climate-data-manipulation-ipcc-ar6',
    title: 'Temperature Anomaly Dataset: Reanalysis of IPCC AR6 Station Coverage',
    excerpt: 'Independent reanalysis of GHCN-Daily station data reveals systematic gaps in African continent coverage affecting AR6 regional projections by 0.4–1.1°C.',
    body: `## Methodology

We downloaded the full GHCN-Daily dataset (v3.30, 115,082 stations) and cross-referenced against IPCC AR6 Chapter 11 regional projections for Africa.

## Key Finding

The 47 stations covering Sub-Saharan Africa have an average data completeness of 61% for the 1990–2020 baseline period — versus 94% for North American stations. This systematic gap has material effects on regional projections.`,
    contentType: 'science',
    publisherName: 'Dr. Amara Diallo',
    publisherHandle: 'amaradiallo',
    publisherVerified: true,
    publishedAt: '2024-10-05T09:00:00Z',
    tags: ['climate', 'ipcc', 'africa', 'data-analysis', 'temperature'],
    aptosTxHash: '0x5e7f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
    blockHash: '0x5e6f7a8b9c0d1e2f',
    shelbyBlobName: 'record-climate-ipcc-2024-v1',
    viewCount: 3890,
    licenseCount: 29,
    basePriceUsd: 10,
    tiers: { view: 10, cite: 39, license: 179 },
    sourceDocs: [],
    featured: false,
  },
  {
    id: '6',
    slug: 'cbn-forex-directive-connected-banks',
    title: 'CBN Forex Directive: How Connected Banks Received Preferential Allocation',
    excerpt: 'Internal CBN memos and FX allocation schedules show eight commercial banks with board members holding dual roles in monetary policy committees received 340% higher forex allocations.',
    body: `## The Documents

CBN internal memos obtained via whistleblower — and now permanently archived and hash-committed on The Record — show FX allocation schedules for Q1–Q3 2023.

## The Conflict of Interest

Of the 24 commercial banks, eight had at least one board member serving concurrently on a CBN advisory committee. These eight received an average of ₦14.2bn in monthly FX allocation versus ₦4.1bn for the remaining sixteen.`,
    contentType: 'financial',
    publisherName: 'Nkechi Obi',
    publisherHandle: 'nkechiobi',
    publisherVerified: true,
    publishedAt: '2024-09-30T08:00:00Z',
    tags: ['cbn', 'forex', 'corruption', 'nigeria', 'banking'],
    aptosTxHash: '0x6f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a',
    blockHash: '0x6f7a8b9c0d1e2f3a',
    shelbyBlobName: 'record-cbn-forex-2024-v1',
    viewCount: 7650,
    licenseCount: 112,
    basePriceUsd: 9,
    tiers: { view: 9, cite: 35, license: 159 },
    sourceDocs: [
      { id: 's6', name: 'cbn-fx-allocation-q1-q3-2023.pdf', type: 'application/pdf', shelbyBlobName: 'doc-cbn-fx', aptosTxHash: '0x...', contentHash: 'sha256:...', sizeKb: 2100 },
    ],
    featured: false,
  },
]

export function getRecord(slug: string): Record | undefined {
  return RECORDS.find((r) => r.slug === slug)
}

export function getFeaturedRecords(): Record[] {
  return RECORDS.filter((r) => r.featured)
}

export function getRecordsByType(type: ContentType): Record[] {
  return RECORDS.filter((r) => r.contentType === type)
}
