import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')
  const targetAddress = address || process.env.APTOS_ACCOUNT_ADDRESS || ''

  if (!targetAddress) return NextResponse.json({ apt: 0, shelbyUsd: 0 })

  try {
    // Use view function - most reliable across all account types
    const viewRes = await fetch(
      'https://api.testnet.aptoslabs.com/v1/view',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: '0x1::coin::balance',
          type_arguments: ['0x1::aptos_coin::AptosCoin'],
          arguments: [targetAddress],
        }),
      }
    )

    if (viewRes.ok) {
      const data = await viewRes.json()
      const octas = parseInt(String(data?.[0] ?? '0'))
      if (!isNaN(octas) && octas > 0) {
        return NextResponse.json({ apt: octas / 1e8, shelbyUsd: 0 })
      }
    }

    // Fallback: primary fungible store balance for APT
    const faRes = await fetch(
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

    if (faRes.ok) {
      const data = await faRes.json()
      const octas = parseInt(String(data?.[0] ?? '0'))
      if (!isNaN(octas) && octas > 0) {
        return NextResponse.json({ apt: octas / 1e8, shelbyUsd: 0 })
      }
    }

    // Last fallback: account info sequence number suggests activity
    return NextResponse.json({ apt: 0, shelbyUsd: 0 })
  } catch (err: any) {
    console.error('[balance]', err)
    return NextResponse.json({ apt: 0, shelbyUsd: 0 })
  }
}
