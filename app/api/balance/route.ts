import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const APT_COIN = '0x1::aptos_coin::AptosCoin'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')
  const targetAddress = address || process.env.APTOS_ACCOUNT_ADDRESS || ''

  if (!targetAddress) return NextResponse.json({ apt: 0, shelbyUsd: 0 })

  try {
    // Use the view function endpoint - most reliable way to get APT balance
    const res = await fetch(
      'https://api.testnet.aptoslabs.com/v1/view',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: '0x1::coin::balance',
          type_arguments: [APT_COIN],
          arguments: [targetAddress],
        }),
      }
    )

    if (res.ok) {
      const data = await res.json()
      // Returns [balance_in_octas]
      const octas = parseInt(data?.[0] || '0')
      if (!isNaN(octas)) {
        return NextResponse.json({ apt: octas / 1e8, shelbyUsd: 0 })
      }
    }

    // Fallback: try fungible asset balance view function
    const res2 = await fetch(
      'https://api.testnet.aptoslabs.com/v1/view',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: '0x1::primary_fungible_store::balance',
          type_arguments: ['0x1::fungible_asset::Metadata'],
          arguments: [
            targetAddress,
            '0x000000000000000000000000000000000000000000000000000000000000000a',
          ],
        }),
      }
    )

    if (res2.ok) {
      const data2 = await res2.json()
      const octas = parseInt(data2?.[0] || '0')
      if (!isNaN(octas) && octas > 0) {
        return NextResponse.json({ apt: octas / 1e8, shelbyUsd: 0 })
      }
    }

    return NextResponse.json({ apt: 0, shelbyUsd: 0 })
  } catch (err: any) {
    console.error('[balance]', err)
    return NextResponse.json({ apt: 0, shelbyUsd: 0, error: err?.message })
  }
}
