import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({}))
  if (password === process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
