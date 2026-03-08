/**
 * lib/content-types.ts
 * Central definition for all six record content types.
 * Import this anywhere you need type labels, colors, or icons.
 */

export type ContentType =
  | 'on-chain'
  | 'investigation'
  | 'journalism'
  | 'science'
  | 'legal'
  | 'financial'

export interface ContentTypeConfig {
  id: ContentType
  label: string
  color: string       // foreground text / badge color (hex)
  bg: string          // badge background (hex)
  border: string      // badge border (hex)
  icon: string        // emoji icon
  description: string
}

export const CONTENT_TYPES: Record<ContentType, ContentTypeConfig> = {
  'on-chain': {
    id: 'on-chain',
    label: 'On-Chain',
    color: '#7C3AED',
    bg: '#F3EEFF',
    border: '#C4B5FD',
    icon: '⛓',
    description: 'Wallet traces, exploit breakdowns, fund flow analysis',
  },
  investigation: {
    id: 'investigation',
    label: 'Investigation',
    color: '#B5371A',
    bg: '#FEF0ED',
    border: '#F4A99A',
    icon: '🔍',
    description: 'Multi-source investigative work, exposés',
  },
  journalism: {
    id: 'journalism',
    label: 'Journalism',
    color: '#1A4B8A',
    bg: '#EEF3FB',
    border: '#AABFDF',
    icon: '📰',
    description: 'Reporting, interviews, whistleblower accounts',
  },
  science: {
    id: 'science',
    label: 'Science',
    color: '#0E7A5A',
    bg: '#EDFAF4',
    border: '#87CFBA',
    icon: '🔬',
    description: 'Research papers, peer reviews, datasets',
  },
  legal: {
    id: 'legal',
    label: 'Legal',
    color: '#92580A',
    bg: '#FEF7EC',
    border: '#F5C47E',
    icon: '⚖️',
    description: 'FOIA releases, court documents, filings',
  },
  financial: {
    id: 'financial',
    label: 'Financial',
    color: '#1A6B3A',
    bg: '#EEFAF3',
    border: '#87CFAA',
    icon: '📊',
    description: 'Independent analysis, fund research',
  },
}

export const CONTENT_TYPE_LIST = Object.values(CONTENT_TYPES)

// ── License tiers ─────────────────────────────────────────────────

export type LicenseTier = 'view' | 'cite' | 'license' | 'institutional'

export interface LicenseTierConfig {
  id: LicenseTier
  label: string
  color: string
  bg: string
  description: string
  features: string[]
}

export const LICENSE_TIERS: Record<LicenseTier, LicenseTierConfig> = {
  view: {
    id: 'view',
    label: 'View',
    color: '#3A3A3A',
    bg: '#F5F5F5',
    description: 'Read-only inside platform viewer',
    features: [
      '48-hour access window',
      'Watermarked render',
      'Platform viewer only',
      'No download, no citation rights',
    ],
  },
  cite: {
    id: 'cite',
    label: 'Cite',
    color: '#1A4B8A',
    bg: '#EEF3FB',
    description: 'Permanent citation rights with certified proof',
    features: [
      'Permanent citation rights',
      'Digitally signed citation PDF',
      'On-chain proof + block hash',
      'Unique citation ID + QR code',
    ],
  },
  license: {
    id: 'license',
    label: 'License',
    color: '#92580A',
    bg: '#FEF7EC',
    description: 'Full professional use with hard watermark',
    features: [
      'Full document download',
      'Hard visible watermark on every page',
      'Certificate of Authenticity',
      'Legal use including court',
    ],
  },
  institutional: {
    id: 'institutional',
    label: 'Institutional',
    color: '#1A6B3A',
    bg: '#EEFAF3',
    description: 'Bulk and API access, custom contract',
    features: [
      'Bulk access + API',
      'Custom contract',
      'For platforms & research orgs',
      'Dedicated support',
    ],
  },
}

export const LICENSE_TIER_LIST = Object.values(LICENSE_TIERS)
