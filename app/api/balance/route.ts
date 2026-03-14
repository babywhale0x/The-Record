import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')
  const targetAddress = address || process.env.APTOS_ACCOUNT_ADDRESS || ''

  if (!targetAddress) return NextResponse.json({ apt: 0, shelbyUsd: 0 })

  try {
    // Try with API key first, fall back to no auth
    const apiKey = process.env.APTOS_API_KEY || process.env.SHELBY_API_KEY || ''
    
    const tryFetch = async (withAuth: boolean) => {
      const headers: Record<string, string> = {}
      if (withAuth && apiKey) headers['Authorization'] = `Bearer ${apiKey}`
      return fetch(
        `https://api.testnet.aptoslabs.com/v1/accounts/${targetAddress}/resources`,
        { headers }
      )
    }

    let res = await tryFetch(true)
    if (!res.ok) res = await tryFetch(false)
    if (!res.ok) return NextResponse.json({ apt: 0, shelbyUsd: 0 })

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
    console.error('[balance]', err)
    return NextResponse.json({ apt: 0, shelbyUsd: 0 })
  }
}
