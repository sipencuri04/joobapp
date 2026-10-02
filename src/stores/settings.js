import { defineStore } from 'pinia'
import { testSupabaseConnection, getSupabaseClient, resetSupabaseClient } from '../services/supabase'
import { testGroqConnection } from '../services/groq'

const DEFAULT_GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    geminiApiKey: localStorage.getItem('autoapply_gemini_api_key') || '',
    groqApiKey: localStorage.getItem('autoapply_groq_api_key') || DEFAULT_GROQ_KEY,
    aiProvider: localStorage.getItem('autoapply_ai_provider') || 'groq', // 'auto' | 'gemini' | 'groq'
    supabaseUrl: localStorage.getItem('autoapply_supabase_url') || '',
    supabaseKey: localStorage.getItem('autoapply_supabase_key') || '',
    preferredEmailMode: localStorage.getItem('autoapply_email_mode') || 'web_compose', // 'web_compose' | 'mailto'
    connectionStatus: {
      supabase: null, // null | true | false
      supabaseMessage: '',
      groq: null,
      groqMessage: ''
    }
  }),

  getters: {
    hasGeminiKey: (state) => Boolean(state.geminiApiKey.trim()),
    hasGroqKey: (state) => Boolean(state.groqApiKey.trim()),
    hasAnyAiKey: (state) => Boolean(state.geminiApiKey.trim() || state.groqApiKey.trim()),
    hasSupabase: (state) => Boolean(state.supabaseUrl.trim() && state.supabaseKey.trim()),
    effectiveAiProvider: (state) => {
      if (state.aiProvider === 'groq' && state.groqApiKey.trim()) return 'groq'
      if (state.aiProvider === 'gemini' && state.geminiApiKey.trim()) return 'gemini'
      // Auto: prefer groq if present, otherwise gemini
      if (state.groqApiKey.trim()) return 'groq'
      if (state.geminiApiKey.trim()) return 'gemini'
      return 'mock'
    }
  },

  actions: {
    setGeminiApiKey(key) {
      this.geminiApiKey = (key || '').trim()
      localStorage.setItem('autoapply_gemini_api_key', this.geminiApiKey)
    },

    setGroqApiKey(key) {
      this.groqApiKey = (key || '').trim() || DEFAULT_GROQ_KEY
      localStorage.setItem('autoapply_groq_api_key', this.groqApiKey)
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
      // Reset client agar rebuild dengan config terbaru
      resetSupabaseClient()
    },

    /**
     * Save API Keys & Preferences to Supabase database (app_settings table)
     * Dipanggil otomatis setiap kali handleSaveSettings()
     */
    async syncSettingsToSupabase() {
      const client = getSupabaseClient()
      if (!client) return false

      try {
        const payload = [
          { key: 'groq_api_key', value: this.groqApiKey, updated_at: new Date().toISOString() },
          { key: 'gemini_api_key', value: this.geminiApiKey, updated_at: new Date().toISOString() },
          { key: 'ai_provider', value: this.aiProvider, updated_at: new Date().toISOString() },
          { key: 'email_mode', value: this.preferredEmailMode, updated_at: new Date().toISOString() }
        ]

        const { error } = await client
          .from('app_settings')
          .upsert(payload, { onConflict: 'key' })

        if (error) {
          console.warn('Sync settings to Supabase notice:', error.message)
          return false
        }
        return true
      } catch (err) {
        console.warn('Sync settings exception:', err)
        return false
      }
    },

    /**
     * Load API Keys & Preferences from Supabase database (app_settings table)
     * Otomatis dipanggil saat koneksi Supabase berhasil / saat app dimuat
     */
    async loadSettingsFromSupabase() {
      const client = getSupabaseClient()
      if (!client) return false

      try {
        const { data, error } = await client
          .from('app_settings')
          .select('*')

        if (error || !data) return false

        data.forEach(item => {
          if (item.key === 'groq_api_key' && item.value) {
            this.groqApiKey = item.value
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

    async testGroq() {
      const keyToTest = this.groqApiKey || DEFAULT_GROQ_KEY
      if (!keyToTest) {
        this.connectionStatus.groq = false
        this.connectionStatus.groqMessage = 'Groq API Key wajib diisi.'
        return false
      }
      const res = await testGroqConnection(keyToTest)
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
