/**
 * lib/supabase.ts
 *
 * Supabase client initialisation.
 *
 * Two clients:
 *   supabasePublic  — uses anon key, respects Row Level Security
 *   supabaseAdmin   — uses service role key, bypasses RLS (server-only)
 *
 * Never import supabaseAdmin from client components.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not set. ' +
    'Add them to .env.local (see .env.example).'
  )
}

/** Browser-safe client — respects RLS */
export const supabasePublic = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? ''
)

/** Server-only client — bypasses RLS. Use only in API routes. */
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl ?? '', supabaseServiceKey, {
      auth: { persistSession: false },
    })
  : null
