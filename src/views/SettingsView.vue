<script setup>
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { useProfileStore } from '../stores/profile'
import { useApplicationStore } from '../stores/applications'
import { 
  Settings, 
  Key, 
  Database, 
  Sparkles, 
  Check, 
  ExternalLink, 
  Copy, 
  Download, 
  Upload, 
  AlertTriangle,
  Server,
  RefreshCw,
  Zap,
  Cpu,
  Plus,
  Trash2
} from 'lucide-vue-next'

const settingsStore = useSettingsStore()
const profileStore = useProfileStore()
const appStore = useApplicationStore()

const apiKeyInput = ref(settingsStore.geminiApiKey)
const groqApiKeysInput = ref(
  settingsStore.groqApiKeys && settingsStore.groqApiKeys.length > 0
    ? [...settingsStore.groqApiKeys]
    : ['']
)
const aiProviderInput = ref(settingsStore.aiProvider)
const supabaseUrlInput = ref(settingsStore.supabaseUrl)
const supabaseKeyInput = ref(settingsStore.supabaseKey)

const isTestingSupabase = ref(false)
const testResultMessage = ref('')
const testResultSuccess = ref(null)

const isTestingGroq = ref(false)
const testGroqMessage = ref('')
const testGroqSuccess = ref(null)

const copiedSchema = ref(false)
const saveSuccess = ref(false)

function addGroqKeyField() {
  groqApiKeysInput.value.push('')
}

function removeGroqKeyField(index) {
  if (groqApiKeysInput.value.length > 1) {
    groqApiKeysInput.value.splice(index, 1)
  } else {
    groqApiKeysInput.value[0] = ''
  }
}

onMounted(async () => {
  if (settingsStore.hasSupabase) {
    try {
      await settingsStore.loadSettingsFromSupabase()
      groqApiKeysInput.value = settingsStore.groqApiKeys && settingsStore.groqApiKeys.length > 0
        ? [...settingsStore.groqApiKeys]
        : ['']
      apiKeyInput.value = settingsStore.geminiApiKey
      aiProviderInput.value = settingsStore.aiProvider
    } catch (e) {
      console.warn('Load settings notice:', e)
    }
  }
})

async function handleSaveSettings() {
  const validGroqKeys = groqApiKeysInput.value.map(k => (k || '').trim()).filter(Boolean)
  settingsStore.setGroqApiKeys(validGroqKeys)
  groqApiKeysInput.value = validGroqKeys.length > 0 ? [...validGroqKeys] : ['']

  settingsStore.setGeminiApiKey(apiKeyInput.value)
  settingsStore.setAiProvider(aiProviderInput.value)
  settingsStore.setSupabaseConfig(supabaseUrlInput.value, supabaseKeyInput.value)
  
  // Sinkronkan API keys ke Supabase (jika Supabase tersambung)
  if (settingsStore.hasSupabase) {
    try {
      await settingsStore.syncSettingsToSupabase()
      await profileStore.fetchFromSupabase()
    } catch (e) {
      console.warn('Auto fetch/sync on save:', e)
    }
  }

  saveSuccess.value = true
  setTimeout(() => {
    saveSuccess.value = false
  }, 3000)
}

async function handleTestGroq(targetKey = '') {
  const validKeys = groqApiKeysInput.value.map(k => (k || '').trim()).filter(Boolean)
  const keyToTest = targetKey.trim() || validKeys[0] || settingsStore.getActiveGroqKey()

  if (!keyToTest) {
    testGroqSuccess.value = false
    testGroqMessage.value = 'Groq API Key wajib diisi terlebih dahulu.'
    return
  }

  isTestingGroq.value = true
  testGroqMessage.value = ''
  testGroqSuccess.value = null

  try {
    const ok = await settingsStore.testGroq(keyToTest)
    testGroqSuccess.value = ok
    testGroqMessage.value = settingsStore.connectionStatus.groqMessage
  } catch (err) {
    testGroqSuccess.value = false
    testGroqMessage.value = err.message
  } finally {
    isTestingGroq.value = false
  }
}

async function handleTestSupabase() {
  settingsStore.setSupabaseConfig(supabaseUrlInput.value, supabaseKeyInput.value)

  if (!supabaseUrlInput.value.trim() || !supabaseKeyInput.value.trim()) {
    testResultSuccess.value = false
    testResultMessage.value = 'URL dan Anon Key Supabase wajib diisi terlebih dahulu.'
    return
  }

  isTestingSupabase.value = true
  testResultMessage.value = ''
  testResultSuccess.value = null

  try {
    const ok = await settingsStore.testSupabase()
    testResultSuccess.value = ok
    testResultMessage.value = settingsStore.connectionStatus.supabaseMessage
    
    if (ok) {
      // Langsung fetch data dari Supabase
      await profileStore.fetchFromSupabase()
    }
  } catch (err) {
    testResultSuccess.value = false
    testResultMessage.value = err.message
  } finally {
    isTestingSupabase.value = false
  }
}

async function copySqlSchema() {
  const schemaText = `-- Jalankan query ini di SQL Editor Supabase Anda:
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    headline TEXT,
    email TEXT,
    phone TEXT,
    location TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    bio TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT,
    description TEXT,
    technologies TEXT[],
    demo_url TEXT,
    repo_url TEXT,
    thumbnail_url TEXT,
    featured BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    position_title TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    status TEXT DEFAULT 'Applied',
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    tailored_cover_letter TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.portfolios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);`

  await navigator.clipboard.writeText(schemaText)
  copiedSchema.value = true
  setTimeout(() => {
    copiedSchema.value = false
  }, 2000)
}

function handleExportBackup() {
  const backup = {
    profile: profileStore.profile,
    experiences: profileStore.experiences,
    educations: profileStore.educations,
    skills: profileStore.skills,
    portfolios: profileStore.portfolios,
    masterCoverLetter: profileStore.masterCoverLetter,
    applications: appStore.applications,
    exportedAt: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `AutoApply_Backup_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function handleImportBackup(e) {
  const file = e.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result)
      if (data.profile) profileStore.profile = data.profile
      if (data.experiences) profileStore.experiences = data.experiences
      if (data.educations) profileStore.educations = data.educations
      if (data.skills) profileStore.skills = data.skills
      if (data.portfolios) profileStore.portfolios = data.portfolios
      if (data.masterCoverLetter) profileStore.masterCoverLetter = data.masterCoverLetter
      if (data.applications) appStore.applications = data.applications
      profileStore.persist()
      appStore.persist()
      alert('Data backup berhasil dipulihkan!')
    } catch (err) {
      alert('File backup JSON tidak valid: ' + err.message)
    }
  }
  reader.readAsText(file)
}
</script>

<template>
  <div class="space-y-6 max-w-4xl">
    <!-- Header -->
    <div class="pb-4 border-b border-slate-200">
      <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
        Pengaturan Integrasi Cloud & AI
      </h1>
      <p class="text-sm text-slate-500 mt-1">
        Kelola koneksi Supabase untuk database portofolio serta Google Gemini API untuk penglihatan AI.
      </p>
    </div>

    <!-- Save Notification -->
    <div v-if="saveSuccess" class="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
      <Check class="w-4 h-4 text-emerald-600" />
      <span class="font-medium">Pengaturan berhasil disimpan dan disinkronkan!</span>
    </div>

    <!-- Supabase Section (Primary) -->
    <div class="clean-card p-6 sm:p-7 space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
        <div class="flex items-center space-x-2.5">
          <div class="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Database class="w-4 h-4" />
          </div>
          <div>
            <h2 class="text-sm sm:text-base font-bold text-slate-900">Koneksi Supabase (Database Utama)</h2>
            <p class="text-xs text-slate-500">Menyimpan dan memuat portofolio proyek, data profil, dan riwayat lamaran</p>
          </div>
        </div>

        <button
          @click="copySqlSchema"
          class="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 self-start sm:self-auto"
        >
          <component :is="copiedSchema ? Check : Copy" class="w-3.5 h-3.5" />
          <span>{{ copiedSchema ? 'SQL Tersalin!' : 'Salin SQL Schema' }}</span>
        </button>
      </div>

      <div class="grid grid-cols-1 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Project URL Supabase</label>
          <input
            v-model="supabaseUrlInput"
            type="text"
            placeholder="https://xyzcompany.supabase.co"
            class="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Anon / Public API Key Supabase</label>
          <input
            v-model="supabaseKeyInput"
            type="password"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            class="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <!-- Test Connection Button & Status -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
          <button
            @click="handleTestSupabase"
            :disabled="isTestingSupabase"
            class="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <Server class="w-3.5 h-3.5 text-slate-500" />
            <span>{{ isTestingSupabase ? 'Menguji koneksi...' : 'Uji Koneksi Supabase' }}</span>
          </button>

          <div v-if="testResultSuccess !== null" class="text-xs font-semibold flex items-center gap-1.5">
            <span :class="testResultSuccess ? 'text-emerald-600' : 'text-rose-600'">
              {{ testResultMessage }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- AI Engine Selection (Groq vs Gemini) -->
    <div class="clean-card p-6 sm:p-7 space-y-4">
      <div class="border-b border-slate-100 pb-3 flex items-center justify-between">
        <div class="flex items-center space-x-2.5">
          <div class="w-8 h-8 rounded-lg bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600">
            <Cpu class="w-4 h-4" />
          </div>
          <div>
            <h2 class="text-sm sm:text-base font-bold text-slate-900">Mesin AI Utama (AI Provider)</h2>
            <p class="text-xs text-slate-500">Pilih provider AI yang ingin digunakan untuk membaca gambar lowongan dan mempersonalisasi surat</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <!-- Option Auto -->
        <label 
          class="p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between"
          :class="aiProviderInput === 'auto' 
            ? 'border-indigo-600 bg-indigo-50/40 text-indigo-950 shadow-xs' 
            : 'border-slate-200 hover:border-slate-300 bg-white'"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-2">
              <Sparkles class="w-4 h-4 text-indigo-600" />
              <span class="text-xs font-bold">Otomatis (Hybrid)</span>
            </div>
            <input type="radio" value="auto" v-model="aiProviderInput" class="text-indigo-600 focus:ring-indigo-500" />
          </div>
          <p class="text-[11px] text-slate-500 leading-snug">
            Prioritas Groq untuk kecepatan kilat, otomatis fallback ke Gemini jika terjadi limit.
          </p>
          <span class="mt-2 text-[10px] font-semibold text-indigo-600 inline-block">Rekomendasi</span>
        </label>

        <!-- Option Groq -->
        <label 
          class="p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between"
          :class="aiProviderInput === 'groq' 
            ? 'border-amber-600 bg-amber-50/40 text-amber-950 shadow-xs' 
            : 'border-slate-200 hover:border-slate-300 bg-white'"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-2">
              <Zap class="w-4 h-4 text-amber-600" />
              <span class="text-xs font-bold">Groq LPU</span>
            </div>
            <input type="radio" value="groq" v-model="aiProviderInput" class="text-amber-600 focus:ring-amber-500" />
          </div>
          <p class="text-[11px] text-slate-500 leading-snug">
            Kecepatan ultra tinggi (< 1 detik). Menggunakan Llama 3.2 Vision & Llama 3.3 70B.
          </p>
          <span class="mt-2 text-[10px] font-semibold text-amber-600 inline-block">Super Fast</span>
        </label>

        <!-- Option Gemini -->
        <label 
          class="p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between"
          :class="aiProviderInput === 'gemini' 
            ? 'border-indigo-600 bg-indigo-50/40 text-indigo-950 shadow-xs' 
            : 'border-slate-200 hover:border-slate-300 bg-white'"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-2">
              <Sparkles class="w-4 h-4 text-indigo-600" />
              <span class="text-xs font-bold">Google Gemini</span>
            </div>
            <input type="radio" value="gemini" v-model="aiProviderInput" class="text-indigo-600 focus:ring-indigo-500" />
          </div>
          <p class="text-[11px] text-slate-500 leading-snug">
            Multimodal resmi Google menggunakan Gemini 3.8 Flash & Gemini 2.0 Flash.
          </p>
          <span class="mt-2 text-[10px] font-semibold text-indigo-600 inline-block">Standard AI</span>
        </label>
      </div>
    </div>

    <!-- Groq LPU Section -->
    <div class="clean-card p-6 sm:p-7 space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
        <div class="flex items-center space-x-2.5">
          <div class="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Zap class="w-4 h-4" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-sm sm:text-base font-bold text-slate-900">Groq Cloud API Key</h2>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                Multi-Key & Auto-Rotate
              </span>
            </div>
            <p class="text-xs text-slate-500">Inference LPU ultra-cepat dengan model Llama 3.2 Vision & Llama 3.3 70B</p>
          </div>
        </div>

        <a
          href="https://console.groq.com/keys"
          target="_blank"
          class="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 underline underline-offset-4 self-start sm:self-auto"
        >
          <span>Dapatkan Key Gratis di Groq Console</span>
          <ExternalLink class="w-3.5 h-3.5" />
        </a>
      </div>

      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <label class="block text-xs font-semibold text-slate-700">
            Daftar API Key Groq ({{ groqApiKeysInput.filter(k => k.trim()).length }} Key Terdaftar)
          </label>
          <span class="text-[11px] text-slate-500 hidden sm:inline">Otomatis rotasi jika limit (429)</span>
        </div>

        <!-- Multi-key input rows -->
        <div class="space-y-2.5">
          <div
            v-for="(keyVal, index) in groqApiKeysInput"
            :key="index"
            class="flex items-center gap-2"
          >
            <div class="relative flex-1">
              <div class="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <Key class="w-4 h-4 text-slate-400" />
                <span class="text-[10px] font-bold text-slate-400">#{{ index + 1 }}</span>
              </div>
              <input
                v-model="groqApiKeysInput[index]"
                type="password"
                :placeholder="index === 0 ? 'gsk_... (Key Utama)' : 'gsk_... (Key Cadangan #' + (index + 1) + ')'"
                class="w-full pl-16 pr-20 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span 
                  v-if="index === 0" 
                  class="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded"
                >
                  Primary
                </span>
                <span 
                  v-else 
                  class="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                >
                  Backup
                </span>
              </div>
            </div>

            <!-- Remove Button -->
            <button
              type="button"
              @click="removeGroqKeyField(index)"
              :disabled="groqApiKeysInput.length === 1 && !groqApiKeysInput[0]"
              class="p-2.5 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 cursor-pointer"
              title="Hapus Key ini"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Add New Key Button -->
        <div class="pt-1">
          <button
            type="button"
            @click="addGroqKeyField"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-50 text-amber-700 hover:text-amber-800 text-xs font-semibold transition-all cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>Tambah API Key Groq Lainnya</span>
          </button>
        </div>

        <!-- Test Connection Button & Status for Groq -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-100">
          <button
            @click="handleTestGroq()"
            :disabled="isTestingGroq"
            class="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Zap class="w-3.5 h-3.5 text-amber-500" />
            <span>{{ isTestingGroq ? 'Menguji koneksi Groq...' : 'Uji Koneksi Groq' }}</span>
          </button>

          <div v-if="testGroqSuccess !== null" class="text-xs font-semibold flex items-center gap-1.5">
            <span :class="testGroqSuccess ? 'text-emerald-600' : 'text-rose-600'">
              {{ testGroqMessage }}
            </span>
          </div>
        </div>

        <!-- Multi-key rotasi explanation box -->
        <div class="p-3.5 bg-gradient-to-r from-amber-50/80 to-orange-50/80 rounded-xl border border-amber-200/80 text-xs text-slate-700 space-y-1.5">
          <div class="flex items-center gap-2 font-bold text-amber-900">
            <Zap class="w-3.5 h-3.5 text-amber-600" />
            <span>Rotasi Multi-Key Otomatis (Anti Rate Limit)</span>
          </div>
          <p class="text-[11px] text-amber-900 leading-relaxed">
            Anda dapat memasukkan beberapa API Key Groq (bisa dari akun Groq berbeda). Jika satu key mencapai batas kuota / rate limit (HTTP 429), sistem akan <strong>otomatis beralih ke key cadangan berikutnya</strong> tanpa membuat proses lamaran gagal!
          </p>
        </div>

        <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
          <p class="font-semibold text-slate-800">Cara Mendapatkan Groq API Key Gratis:</p>
          <ol class="list-decimal list-inside space-y-1 text-slate-600">
            <li>Kunjungi <a href="https://console.groq.com/keys" target="_blank" class="text-amber-600 hover:underline font-medium">console.groq.com/keys</a> dan login / daftar akun.</li>
            <li>Klik tombol <strong>"Create API Key"</strong>.</li>
            <li>Salin key yang berawalan <code class="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-mono">gsk_...</code> lalu paste pada kolom di atas.</li>
          </ol>
        </div>
      </div>
    </div>

    <!-- Gemini AI Section -->
    <div class="clean-card p-6 sm:p-7 space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
        <div class="flex items-center space-x-2.5">
          <div class="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Sparkles class="w-4 h-4" />
          </div>
          <div>
            <h2 class="text-sm sm:text-base font-bold text-slate-900">Google Gemini API Key</h2>
            <p class="text-xs text-slate-500">Model multimodal Gemini 3.8 Flash & 2.0 Flash untuk analisis gambar lowongan</p>
          </div>
        </div>

        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          class="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 underline underline-offset-4 self-start sm:self-auto"
        >
          <span>Dapatkan Key Gratis di Google AI Studio</span>
          <ExternalLink class="w-3.5 h-3.5" />
        </a>
      </div>

      <div class="space-y-3">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">API Key Gemini</label>
          <div class="relative">
            <input
              v-model="apiKeyInput"
              type="password"
              placeholder="AIzaSy..."
              class="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <Key class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
          <p class="font-semibold text-slate-800">Cara Mendapatkan Gemini API Key Gratis:</p>
          <ol class="list-decimal list-inside space-y-1 text-slate-600">
            <li>Buka <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-indigo-600 hover:underline font-medium">Google AI Studio</a> dan login dengan akun Google.</li>
            <li>Klik tombol <strong>"Create API Key"</strong>.</li>
            <li>Salin kodenya dan paste pada kolom di atas, lalu klik <strong>Simpan Semua Pengaturan</strong>.</li>
          </ol>
        </div>
      </div>
    </div>

    <!-- Backup & Restore Data -->
    <div class="clean-card p-6 sm:p-7 space-y-4">
      <div class="border-b border-slate-100 pb-3">
        <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
          <Download class="w-4 h-4 text-indigo-600" />
          <span>Cadangan & Pemulihan Data (JSON Backup)</span>
        </h2>
        <p class="text-xs text-slate-500 mt-0.5">
          Ekspor seluruh data CV, portofolio, dan riwayat lamaran ke file JSON offline, atau restore kapan saja.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3 pt-1">
        <button
          @click="handleExportBackup"
          class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors shadow-xs"
        >
          <Download class="w-3.5 h-3.5 text-slate-500" />
          <span>Download Backup JSON</span>
        </button>

        <label class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors shadow-xs cursor-pointer">
          <Upload class="w-3.5 h-3.5 text-slate-500" />
          <span>Import / Restore Backup</span>
          <input type="file" accept=".json" class="hidden" @change="handleImportBackup" />
        </label>
      </div>
    </div>

    <!-- Save Action Button -->
    <div class="flex justify-end pt-2">
      <button
        @click="handleSaveSettings"
        class="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-all"
      >
        Simpan Semua Pengaturan
      </button>
    </div>
  </div>
</template>
