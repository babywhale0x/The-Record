import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { query, mode } = await req.json()
    if (!query?.trim()) return NextResponse.json({ error: 'No query' }, { status: 400 })

    const anthropicKey = process.env.ANTHROPIC_API_KEY || ''
    if (!anthropicKey) {
      return NextResponse.json({ error: 'AI not configured — add ANTHROPIC_API_KEY to Vercel env vars' }, { status: 503 })
    }

    // Fetch records from Supabase
    let records: any[] = []
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('records')
        .select('id, slug, title, excerpt, content_type, publisher_name, tags, aptos_tx_hash, price_view, created_at')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(100)
      records = data || []
    }

    const recordsContext = records.length > 0
      ? records.map((r, i) =>
          `[${i + 1}] slug:"${r.slug}" title:"${r.title}" type:${r.content_type} publisher:${r.publisher_name} excerpt:"${r.excerpt}" tags:${(r.tags || []).join(',')}`
        ).join('\n')
      : 'No records currently in the archive.'

    const systemPrompt = mode === 'ask'
      ? `You are the AI assistant for The Record — a permanent, censorship-resistant knowledge archive on the Aptos blockchain. Answer questions using the published records below as your knowledge base. Be direct and cite records by title when relevant.

Archive records:
${recordsContext}`
      : `You are the search intelligence for The Record archive. Find the most relevant records for the user's description.
Return ONLY valid JSON with no markdown, no backticks:
{"interpretation":"one sentence of what user wants","matches":[{"slug":"exact-slug","title":"exact title","relevance":"why it matches in 1-2 sentences","score":0}],"keywords":["term1","term2"],"suggestion":"alternative if no matches"}
Scores 0-100. Only include genuinely relevant records.

Archive:
${recordsContext}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: query }],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[ai/search] Anthropic error:', response.status, errText)
      return NextResponse.json({ error: `AI error: ${response.status}` }, { status: 502 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ''

    if (mode === 'ask') {
      return NextResponse.json({ answer: text })
    }

    try {
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      const enriched = (parsed.matches || []).map((m: any) => {
        const record = records.find(r => r.slug === m.slug)
        return record ? { ...record, relevance: m.relevance, score: m.score } : null
      }).filter(Boolean)

      return NextResponse.json({
        interpretation: parsed.interpretation || query,
        matches: enriched,
        keywords: parsed.keywords || [],
        suggestion: parsed.suggestion || null,
      })
    } catch {
      return NextResponse.json({
        interpretation: query,
        matches: [],
        keywords: [],
        suggestion: text.slice(0, 200),
      })
    }
  } catch (err: any) {
    console.error('[ai/search] error:', err)
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 })
  }
}
