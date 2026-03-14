import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')
  const targetAddress = address || process.env.APTOS_ACCOUNT_ADDRESS || ''

  if (!targetAddress) return NextResponse.json({ apt: 0, shelbyUsd: 0 })

  try {
    const apiKey = process.env.APTOS_API_KEY || process.env.SHELBY_API_KEY || ''
    const headers: Record<string, string> = {}
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

    const res = await fetch(
      `https://api.testnet.aptoslabs.com/v1/accounts/${targetAddress}/resources`,
      { headers }
    )
    if (!res.ok) return NextResponse.json({ apt: 0, shelbyUsd: 0 })

    const resources = await res.json()

    // Try legacy CoinStore first
    const coinStore = resources.find(
      (r: any) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
    )
    if (coinStore?.data?.coin?.value) {
      const apt = parseInt(coinStore.data.coin.value) / 1e8
      return NextResponse.json({ apt, shelbyUsd: 0 })
    }

    // Try new Fungible Asset standard
    // APT metadata address on testnet
    const APT_METADATA = '0x000000000000000000000000000000000000000000000000000000000000000a'
    const fungibleStores = resources.filter(
      (r: any) => r.type === '0x1::fungible_asset::FungibleStore'
    )
    for (const store of fungibleStores) {
      const meta = store.data?.metadata?.inner || ''
      // Check if it's APT (address ends in ...000a)
      if (meta.endsWith('a') || meta === APT_METADATA) {
        const balance = parseInt(store.data?.balance || '0')
        if (balance > 0) {
          const apt = balance / 1e8
          return NextResponse.json({ apt, shelbyUsd: 0 })
        }
      }
    }

    // Last resort: sum all fungible stores and return largest
    if (fungibleStores.length > 0) {
      const largest = fungibleStores.reduce((max: any, s: any) => {
        const bal = parseInt(s.data?.balance || '0')
        const maxBal = parseInt(max?.data?.balance || '0')
        return bal > maxBal ? s : max
      }, fungibleStores[0])
      const apt = parseInt(largest.data?.balance || '0') / 1e8
      if (apt > 0) return NextResponse.json({ apt, shelbyUsd: 0 })
    }

    return NextResponse.json({ apt: 0, shelbyUsd: 0 })
  } catch (err) {
    console.error('[balance]', err)
    return NextResponse.json({ apt: 0, shelbyUsd: 0 })
  }
}
