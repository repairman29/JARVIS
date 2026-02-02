import { createBrowserClient } from '@supabase/ssr'

const url = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined
const key = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : undefined

export const isSupabaseConfigured = Boolean(url && key)

export const supabase = isSupabaseConfigured && url && key
  ? createBrowserClient(url, key)
  : null
