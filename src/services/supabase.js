import { createClient } from '@supabase/supabase-js'

let supabaseInstance = null
let cachedUrl = null
let cachedKey = null

const SUPABASE_AUTH_OPTIONS = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
}

export function getSupabaseCredentials() {
  const url = localStorage.getItem('autoapply_supabase_url') || import.meta.env.VITE_SUPABASE_URL || ''
  const key = localStorage.getItem('autoapply_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  return { url: url.trim(), key: key.trim() }
}

/**
 * Reset client agar dibangun ulang dengan config terbaru.
 * Dipanggil setiap kali setSupabaseConfig() dijalankan.
 */
export function resetSupabaseClient() {
  supabaseInstance = null
  cachedUrl = null
  cachedKey = null
}

export function getSupabaseClient() {
  const { url, key } = getSupabaseCredentials()
  if (!url || !key) return null

  // Rebuild client jika URL atau Key berubah
  if (!supabaseInstance || cachedUrl !== url || cachedKey !== key) {
    try {
      supabaseInstance = createClient(url, key, SUPABASE_AUTH_OPTIONS)
      cachedUrl = url
      cachedKey = key
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e)
      return null
    }
  }
  return supabaseInstance
}

export function isSupabaseConfigured() {
  const { url, key } = getSupabaseCredentials()
  return Boolean(url && key)
}

export async function testSupabaseConnection(url, key) {
  try {
    const testClient = createClient(url, key, SUPABASE_AUTH_OPTIONS)
    const { error } = await testClient.from('profiles').select('count', { count: 'exact', head: true })
    if (error && error.code !== 'PGRST116') {
      return { success: false, message: error.message }
    }
    return { success: true, message: 'Koneksi ke Supabase berhasil!' }
  } catch (err) {
    return { success: false, message: err.message || 'Gagal terhubung ke Supabase' }
  }
}
