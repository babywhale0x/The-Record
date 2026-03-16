/**
 * lib/contract.ts
 * Frontend integration for The Record smart contract
 * Module: {PLATFORM_ADDRESS}::record_registry
 */

const PLATFORM_ADDRESS = process.env.NEXT_PUBLIC_PLATFORM_ADDRESS ||
  '0xa8c20d49b063e41aff19123fd2263d0b9945ec9708ce9d7ec72d68f485043cb8'

const MODULE = `${PLATFORM_ADDRESS}::record_registry`

export const CONTRACT = {
  PLATFORM_ADDRESS,
  MODULE,

  // Transaction payloads for wallet adapter
  registerRecord: (
    slug: string,
    contentHash: string,
    shelbyBlobName: string,
    priceView: number,
    priceCite: number,
    priceLicense: number,
  ) => ({
    function: `${MODULE}::register_record`,
    typeArguments: [],
    functionArguments: [
      PLATFORM_ADDRESS,
      slug,
      contentHash,
      shelbyBlobName,
      priceView,
      priceCite,
      priceLicense,
    ],
  }),

  purchaseLicense: (recordSlug: string, tier: 1 | 2 | 3) => ({
    function: `${MODULE}::purchase_license`,
    typeArguments: [],
    functionArguments: [
      PLATFORM_ADDRESS,
      recordSlug,
      tier,
    ],
  }),

  // View function calls (via Aptos REST API)
  getRecord: async (slug: string) => {
    const res = await fetch('https://api.testnet.aptoslabs.com/v1/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function: `${MODULE}::get_record`,
        type_arguments: [],
        arguments: [PLATFORM_ADDRESS, slug],
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return {
      contentHash: data[0],
      publisher: data[1],
      priceView: parseInt(data[2]),
      priceCite: parseInt(data[3]),
      priceLicense: parseInt(data[4]),
      isActive: data[5],
    }
  },

  hasLicense: async (userAddress: string, recordSlug: string, minTier: 1 | 2 | 3 = 1) => {
    const res = await fetch('https://api.testnet.aptoslabs.com/v1/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function: `${MODULE}::has_license`,
        type_arguments: [],
        arguments: [PLATFORM_ADDRESS, userAddress, recordSlug, minTier],
      }),
    })
    if (!res.ok) return false
    const data = await res.json()
    return data[0] === true
  },

  getStats: async () => {
    const res = await fetch('https://api.testnet.aptoslabs.com/v1/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function: `${MODULE}::get_stats`,
        type_arguments: [],
        arguments: [PLATFORM_ADDRESS],
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return {
      totalRecords: parseInt(data[0]),
      totalLicenses: parseInt(data[1]),
      totalVolume: parseInt(data[2]),
    }
  },
}

export type LicenseTier = 1 | 2 | 3
export const TIER_VIEW: LicenseTier = 1
export const TIER_CITE: LicenseTier = 2
export const TIER_LICENSE: LicenseTier = 3
