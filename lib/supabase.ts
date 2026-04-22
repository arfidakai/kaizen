import { createBrowserClient } from '@supabase/ssr'

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Use a valid placeholder so createBrowserClient doesn't throw at build time
const SUPABASE_URL = rawUrl.startsWith('http') ? rawUrl : 'https://placeholder.supabase.co'
const SUPABASE_KEY = rawKey.length > 10 ? rawKey : 'placeholder-anon-key-for-build'

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY)
}

export function isSupabaseConfigured(): boolean {
  return rawUrl.startsWith('http') && rawKey.length > 10
}
