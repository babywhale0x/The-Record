import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')
  const debug = searchParams.get('debug') === '1'
  const targetAddress = address || process.env.APTOS_ACCOUNT_ADDRESS || ''

  if (!targetAddress) return NextResponse.json({ apt: 0, shelbyUsd: 0 })

  try {
    const res = await fetch(
      `https://api.testnet.aptoslabs.com/v1/accounts/${targetAddress}/resources`,
    )

    if (!res.ok) {
      return NextResponse.json({ apt: 0, shelbyUsd: 0, error: `Aptos API ${res.status}` })
    }

    const resources = await res.json()
    const types = resources.map((r: any) => r.type)

    if (debug) {
      return NextResponse.json({ types, count: resources.length })
    }

    // Legacy CoinStore
    const coinStore = resources.find(
      (r: any) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
    )
    if (coinStore?.data?.coin?.value) {
      return NextResponse.json({ apt: parseInt(coinStore.data.coin.value) / 1e8, shelbyUsd: 0 })
    }

    // New Fungible Asset - find largest balance
    const fungibleStores = resources.filter(
      (r: any) => r.type === '0x1::fungible_asset::FungibleStore'
    )

    if (fungibleStores.length > 0) {
      const largest = fungibleStores.reduce((max: any, s: any) => {
        return parseInt(s.data?.balance || '0') > parseInt(max?.data?.balance || '0') ? s : max
      }, fungibleStores[0])
      const apt = parseInt(largest.data?.balance || '0') / 1e8
      return NextResponse.json({ apt, shelbyUsd: 0 })
    }

    // Try account balance endpoint directly
    const balRes = await fetch(
      `https://api.testnet.aptoslabs.com/v1/accounts/${targetAddress}`
    )
    if (balRes.ok) {
      const acct = await balRes.json()
      if (debug) return NextResponse.json({ acct })
    }

    return NextResponse.json({ apt: 0, shelbyUsd: 0, types })
  } catch (err: any) {
    return NextResponse.json({ apt: 0, shelbyUsd: 0, error: err?.message })
  }
}
