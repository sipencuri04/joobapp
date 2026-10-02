import { defineStore } from 'pinia'
import { testSupabaseConnection, getSupabaseClient, resetSupabaseClient } from '../services/supabase'
import { testGroqConnection } from '../services/groq'

const DEFAULT_GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

function loadGroqKeys() {
  try {
    const raw = localStorage.getItem('autoapply_groq_api_keys')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  // Fallback: migrasi dari key lama (single)
  const legacy = localStorage.getItem('autoapply_groq_api_key') || DEFAULT_GROQ_KEY
  return legacy ? [legacy] : []
}

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    geminiApiKey: localStorage.getItem('autoapply_gemini_api_key') || '',
    // Multiple Groq API Keys - rotasi otomatis saat rate limit
    groqApiKeys: loadGroqKeys(),
    groqKeyIndex: 0, // index aktif untuk round-robin
    aiProvider: localStorage.getItem('autoapply_ai_provider') || 'groq',
    supabaseUrl: localStorage.getItem('autoapply_supabase_url') || '',
    supabaseKey: localStorage.getItem('autoapply_supabase_key') || '',
    preferredEmailMode: localStorage.getItem('autoapply_email_mode') || 'web_compose',
    connectionStatus: {
      supabase: null,
      supabaseMessage: '',
      groq: null,
      groqMessage: ''
    }
  }),

  getters: {
    // Backward compatible: primary key (key pertama)
    groqApiKey: (state) => state.groqApiKeys[0] || '',
    hasGeminiKey: (state) => Boolean(state.geminiApiKey.trim()),
    hasGroqKey: (state) => state.groqApiKeys.some(k => k.trim()),
    hasAnyAiKey: (state) => Boolean(state.geminiApiKey.trim() || state.groqApiKeys.some(k => k.trim())),
    hasSupabase: (state) => Boolean(state.supabaseUrl.trim() && state.supabaseKey.trim()),
    effectiveAiProvider: (state) => {
      const hasGroq = state.groqApiKeys.some(k => k.trim())
      if (state.aiProvider === 'groq' && hasGroq) return 'groq'
      if (state.aiProvider === 'gemini' && state.geminiApiKey.trim()) return 'gemini'
      if (hasGroq) return 'groq'
      if (state.geminiApiKey.trim()) return 'gemini'
      return 'mock'
    },
    activeGroqKeysCount: (state) => state.groqApiKeys.filter(k => k.trim()).length
  },

  actions: {
    // ── Groq Keys Management ──────────────────────────────

    /** Dapatkan key aktif untuk dipakai (round-robin) */
    getActiveGroqKey() {
      const validKeys = this.groqApiKeys.filter(k => k.trim())
      if (!validKeys.length) return ''
      const idx = this.groqKeyIndex % validKeys.length
      return validKeys[idx]
    },

    /** Rotasi ke key berikutnya (dipanggil saat rate limit) */
    rotateGroqKey() {
      const validKeys = this.groqApiKeys.filter(k => k.trim())
      if (validKeys.length <= 1) return
      this.groqKeyIndex = (this.groqKeyIndex + 1) % validKeys.length
      console.log(`[Groq] Rotating to key index ${this.groqKeyIndex}`)
    },

    setGroqApiKeys(keys) {
      this.groqApiKeys = keys.filter(k => k.trim())
      this.groqKeyIndex = 0
      localStorage.setItem('autoapply_groq_api_keys', JSON.stringify(this.groqApiKeys))
      // Backward compat: simpan key pertama juga ke key lama
      localStorage.setItem('autoapply_groq_api_key', this.groqApiKeys[0] || '')
    },

    addGroqApiKey(key) {
      const trimmed = (key || '').trim()
      if (!trimmed || this.groqApiKeys.includes(trimmed)) return
      this.groqApiKeys.push(trimmed)
      localStorage.setItem('autoapply_groq_api_keys', JSON.stringify(this.groqApiKeys))
      localStorage.setItem('autoapply_groq_api_key', this.groqApiKeys[0] || '')
    },

    removeGroqApiKey(index) {
      this.groqApiKeys.splice(index, 1)
      this.groqKeyIndex = 0
      localStorage.setItem('autoapply_groq_api_keys', JSON.stringify(this.groqApiKeys))
      localStorage.setItem('autoapply_groq_api_key', this.groqApiKeys[0] || '')
    },

    updateGroqApiKey(index, key) {
      const trimmed = (key || '').trim()
      if (trimmed) {
        this.groqApiKeys[index] = trimmed
      } else {
        this.groqApiKeys.splice(index, 1)
      }
      localStorage.setItem('autoapply_groq_api_keys', JSON.stringify(this.groqApiKeys))
      localStorage.setItem('autoapply_groq_api_key', this.groqApiKeys[0] || '')
    },

    // ── Legacy single key setter (backward compat) ────────
    setGroqApiKey(key) {
      const trimmed = (key || '').trim()
      if (trimmed && !this.groqApiKeys.includes(trimmed)) {
        if (this.groqApiKeys.length === 0) {
          this.groqApiKeys.push(trimmed)
        } else {
          this.groqApiKeys[0] = trimmed
        }
        localStorage.setItem('autoapply_groq_api_keys', JSON.stringify(this.groqApiKeys))
        localStorage.setItem('autoapply_groq_api_key', trimmed)
      }
    },

    setGeminiApiKey(key) {
      this.geminiApiKey = (key || '').trim()
      localStorage.setItem('autoapply_gemini_api_key', this.geminiApiKey)
    },

    setAiProvider(provider) {
      this.aiProvider = provider
      localStorage.setItem('autoapply_ai_provider', provider)
    },

    setSupabaseConfig(url, key) {
      this.supabaseUrl = (url || '').trim()
      this.supabaseKey = (key || '').trim()
      localStorage.setItem('autoapply_supabase_url', this.supabaseUrl)
      localStorage.setItem('autoapply_supabase_key', this.supabaseKey)
      resetSupabaseClient()
    },

    // ── Supabase Sync ─────────────────────────────────────

    async syncSettingsToSupabase() {
      const client = getSupabaseClient()
      if (!client) {
        return { success: false, message: 'URL atau Anon Key Supabase belum diisi atau tidak valid.' }
      }

      try {
        const payload = [
          { key: 'groq_api_keys', value: JSON.stringify(this.groqApiKeys), updated_at: new Date().toISOString() },
          { key: 'groq_api_key', value: this.groqApiKeys[0] || '', updated_at: new Date().toISOString() },
          { key: 'gemini_api_key', value: this.geminiApiKey, updated_at: new Date().toISOString() },
          { key: 'ai_provider', value: this.aiProvider, updated_at: new Date().toISOString() },
          { key: 'email_mode', value: this.preferredEmailMode, updated_at: new Date().toISOString() }
        ]

        const { error } = await client
          .from('app_settings')
          .upsert(payload, { onConflict: 'key' })

        if (error) {
          console.warn('Sync settings to Supabase notice:', error.message)
          return { success: false, message: error.message }
        }
        return { success: true, message: 'API Key & konfigurasi berhasil disinkronkan ke tabel app_settings di Supabase!' }
      } catch (err) {
        console.warn('Sync settings exception:', err)
        return { success: false, message: err.message || 'Gagal menyimpan ke database Supabase.' }
      }
    },

    async loadSettingsFromSupabase() {
      const client = getSupabaseClient()
      if (!client) return false

      try {
        const { data, error } = await client
          .from('app_settings')
          .select('*')

        if (error || !data) return false

        data.forEach(item => {
          if (item.key === 'groq_api_keys' && item.value) {
            try {
              const keys = JSON.parse(item.value)
              if (Array.isArray(keys) && keys.length > 0) {
                this.groqApiKeys = keys
                this.groqKeyIndex = 0
                localStorage.setItem('autoapply_groq_api_keys', item.value)
                localStorage.setItem('autoapply_groq_api_key', keys[0] || '')
              }
            } catch {}
          }
          // Fallback: legacy single key (jika groq_api_keys belum ada)
          if (item.key === 'groq_api_key' && item.value && this.groqApiKeys.length === 0) {
            this.groqApiKeys = [item.value]
            localStorage.setItem('autoapply_groq_api_keys', JSON.stringify([item.value]))
            localStorage.setItem('autoapply_groq_api_key', item.value)
          }
          if (item.key === 'gemini_api_key' && item.value) {
            this.geminiApiKey = item.value
            localStorage.setItem('autoapply_gemini_api_key', item.value)
          }
          if (item.key === 'ai_provider' && item.value) {
            this.aiProvider = item.value
            localStorage.setItem('autoapply_ai_provider', item.value)
          }
          if (item.key === 'email_mode' && item.value) {
            this.preferredEmailMode = item.value
            localStorage.setItem('autoapply_email_mode', item.value)
          }
        })
        return true
      } catch (err) {
        console.warn('Load settings from Supabase exception:', err)
        return false
      }
    },

    async testSupabase() {
      if (!this.supabaseUrl || !this.supabaseKey) {
        this.connectionStatus.supabase = false
        this.connectionStatus.supabaseMessage = 'URL dan Anon Key Supabase wajib diisi.'
        return false
      }
      const res = await testSupabaseConnection(this.supabaseUrl, this.supabaseKey)
      this.connectionStatus.supabase = res.success
      this.connectionStatus.supabaseMessage = res.message

      if (res.success) {
        await this.loadSettingsFromSupabase()
      }

      return res.success
    },

    async testGroq(keyToTest) {
      const key = keyToTest || this.getActiveGroqKey()
      if (!key) {
        this.connectionStatus.groq = false
        this.connectionStatus.groqMessage = 'Groq API Key wajib diisi.'
        return false
      }
      const res = await testGroqConnection(key)
      this.connectionStatus.groq = res.success
      this.connectionStatus.groqMessage = res.message
      return res.success
    },

    clearSupabaseConfig() {
      this.supabaseUrl = ''
      this.supabaseKey = ''
      this.connectionStatus.supabase = null
      this.connectionStatus.supabaseMessage = ''
      localStorage.removeItem('autoapply_supabase_url')
      localStorage.removeItem('autoapply_supabase_key')
    }
  }
})
