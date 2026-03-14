import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')

  // If address param provided, fetch that wallet's balance publicly
  const targetAddress = address || process.env.APTOS_ACCOUNT_ADDRESS || ''

  if (!targetAddress) {
    return NextResponse.json({ apt: 0, shelbyUsd: 0 })
  }

  try {
    const apiKey = process.env.SHELBY_API_KEY || ''
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

    const res = await fetch(
      `https://api.testnet.aptoslabs.com/v1/accounts/${targetAddress}/resources`,
      { headers }
    )

    if (!res.ok) {
      return NextResponse.json({ apt: 0, shelbyUsd: 0 })
    }

    const resources = await res.json()
    const aptResource = resources.find(
      (r: any) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
    )
    const aptOctas = aptResource?.data?.coin?.value
      ? parseInt(aptResource.data.coin.value)
      : 0
    const apt = aptOctas / 1e8

    return NextResponse.json({ apt, shelbyUsd: 0 })
  } catch (err) {
    console.error('[balance] error:', err)
    return NextResponse.json({ apt: 0, shelbyUsd: 0 })
  }
}
