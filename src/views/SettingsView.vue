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
  Trash2,
  ChevronRight
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
const copiedSettingsSql = ref(false)
const saveSuccess = ref(false)
const supabaseSyncResult = ref(null)

const settingsSections = [
  { id: 'set-supabase', label: 'Supabase', icon: Database },
  { id: 'set-ai', label: 'Mesin AI', icon: Cpu },
  { id: 'set-groq', label: 'Groq', icon: Zap },
  { id: 'set-gemini', label: 'Gemini', icon: Sparkles },
  { id: 'set-backup', label: 'Backup', icon: Download }
]

function jumpTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const providerOptions = [
  { value: 'auto', title: 'Otomatis (Hybrid)', desc: 'Prioritas Groq, otomatis fallback ke Gemini jika limit.', tag: 'Rekomendasi', icon: Sparkles, tone: 'indigo' },
  { value: 'groq', title: 'Groq LPU', desc: 'Ultra cepat (< 1 detik). Llama 3.2 Vision & Llama 3.3 70B.', tag: 'Super Fast', icon: Zap, tone: 'amber' },
  { value: 'gemini', title: 'Google Gemini', desc: 'Multimodal Google: Gemini 3.8 Flash & 2.0 Flash.', tag: 'Standard AI', icon: Sparkles, tone: 'indigo' }
]

const settingsSql = `-- Jalankan ini di Supabase > SQL Editor untuk membuat tabel app_settings
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON public.app_settings;
CREATE POLICY "Allow all" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);`

function copySettingsSql() {
  navigator.clipboard.writeText(settingsSql)
  copiedSettingsSql.value = true
  setTimeout(() => {
    copiedSettingsSql.value = false
  }, 3000)
}

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
      const syncRes = await settingsStore.syncSettingsToSupabase()
      supabaseSyncResult.value = syncRes
      await profileStore.fetchFromSupabase()
    } catch (e) {
      supabaseSyncResult.value = { success: false, message: e.message }
    }
  } else {
    supabaseSyncResult.value = null
  }

  saveSuccess.value = true
  // Pastikan notifikasi hasil simpan terlihat (terutama di mobile)
  window.scrollTo({ top: 0, behavior: 'smooth' })
  setTimeout(() => {
    saveSuccess.value = false
  }, 8000)
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
      // Langsung fetch data profil & portofolio dari Supabase
      await profileStore.fetchFromSupabase()
      // Update form input dengan data API Keys yang baru saja dimuat dari Supabase
      groqApiKeysInput.value = settingsStore.groqApiKeys && settingsStore.groqApiKeys.length > 0
        ? [...settingsStore.groqApiKeys]
        : ['']
      apiKeyInput.value = settingsStore.geminiApiKey || ''
      aiProviderInput.value = settingsStore.aiProvider || 'groq'
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

DROP POLICY IF EXISTS "Allow all" ON public.profiles;
CREATE POLICY "Allow all" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all" ON public.portfolios;
CREATE POLICY "Allow all" ON public.portfolios FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all" ON public.applications;
CREATE POLICY "Allow all" ON public.applications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all" ON public.app_settings;
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
  <div class="space-y-4 sm:space-y-6 max-w-4xl pb-20 lg:pb-0">
    <!-- Header -->
    <div class="lg:pb-4 lg:border-b lg:border-slate-200">
      <h1 class="page-title hidden lg:block">Pengaturan Integrasi Cloud & AI</h1>
      <p class="page-subtitle !mt-0 lg:!mt-1">
        Kelola koneksi Supabase (database) dan API Key AI untuk membaca lowongan.
      </p>
    </div>

    <!-- Quick jump -->
    <div class="sticky top-14 lg:top-0 z-20 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 py-2 bg-slate-50/95 backdrop-blur-md lg:hidden">
      <div class="flex gap-2 overflow-x-auto hide-scrollbar">
        <button
          v-for="sec in settingsSections"
          :key="sec.id"
          @click="jumpTo(sec.id)"
          class="chip chip-idle"
        >
          <component :is="sec.icon" class="w-4 h-4" />
          <span>{{ sec.label }}</span>
        </button>
      </div>
    </div>

    <!-- Save Notification -->
    <div v-if="saveSuccess" class="space-y-2" role="status" aria-live="polite">
      <div v-if="supabaseSyncResult?.success" class="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-[13px] flex items-start gap-2.5">
        <Check class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div class="leading-relaxed">
          <span class="font-bold">Pengaturan berhasil disimpan!</span>
          <span class="text-emerald-700"> Semua API Key tersinkron ke tabel <code>app_settings</code> di Supabase — aman saat pindah device.</span>
        </div>
      </div>

      <div v-else-if="supabaseSyncResult && !supabaseSyncResult.success" class="p-3.5 bg-amber-50 border border-amber-300 text-amber-950 rounded-2xl text-[13px]">
        <div class="flex items-start gap-2.5">
          <AlertTriangle class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div class="space-y-2 flex-1 min-w-0">
            <p class="font-bold text-amber-900">Tersimpan di browser ini, namun GAGAL tersimpan ke Supabase.</p>
            <p class="font-mono text-[11px] bg-amber-100/80 p-2 rounded-lg border border-amber-200 text-amber-950 break-all">
              Error: {{ supabaseSyncResult.message }}
            </p>
            <p class="text-xs text-amber-800 leading-relaxed">
              Jika error menyatakan <em>"relation public.app_settings does not exist"</em>, tabel <code>app_settings</code> belum dibuat. Salin SQL di bawah, lalu Run di <strong>Supabase Dashboard › SQL Editor</strong>.
            </p>
            <div class="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 pt-1">
              <button
                type="button"
                @click="copySettingsSql"
                class="btn btn-sm bg-amber-600 hover:bg-amber-700 text-white"
              >
                <component :is="copiedSettingsSql ? Check : Copy" class="w-4 h-4" />
                <span>{{ copiedSettingsSql ? 'SQL Tersalin!' : 'Salin SQL app_settings' }}</span>
              </button>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener"
                class="btn btn-sm bg-white hover:bg-amber-50 text-amber-800 border border-amber-300"
              >
                <span>Buka Supabase SQL Editor</span>
                <ExternalLink class="w-4 h-4 text-amber-600" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-[13px] flex items-start gap-2">
        <Check class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <span class="font-medium">Pengaturan tersimpan di browser ini. (Supabase belum dikonfigurasi)</span>
      </div>
    </div>

    <!-- Supabase -->
    <section id="set-supabase" class="clean-card card-pad space-y-5 scroll-mt-32 lg:scroll-mt-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex items-start gap-3 min-w-0">
          <div class="w-10 h-10 shrink-0 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Database class="w-5 h-5" />
          </div>
          <div class="min-w-0">
            <h2 class="section-title">Koneksi Supabase</h2>
            <p class="section-desc">Database utama untuk portofolio, profil, dan riwayat lamaran.</p>
          </div>
        </div>
        <button @click="copySqlSchema" class="btn btn-sm bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 self-stretch sm:self-auto">
          <component :is="copiedSchema ? Check : Copy" class="w-4 h-4" />
          <span>{{ copiedSchema ? 'SQL Tersalin!' : 'Salin SQL Schema' }}</span>
        </button>
      </div>

      <div class="space-y-4">
        <div>
          <label class="form-label" for="sb-url">Project URL</label>
          <input
            id="sb-url"
            v-model="supabaseUrlInput"
            type="url"
            inputmode="url"
            autocapitalize="off"
            autocorrect="off"
            spellcheck="false"
            placeholder="https://xyzcompany.supabase.co"
            class="form-input form-input-mono"
          />
        </div>
        <div>
          <label class="form-label" for="sb-key">Anon / Public API Key</label>
          <input
            id="sb-key"
            v-model="supabaseKeyInput"
            type="password"
            autocomplete="off"
            placeholder="eyJhbGciOiJIUzI1NiIs..."
            class="form-input form-input-mono"
          />
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
          <button @click="handleTestSupabase" :disabled="isTestingSupabase" class="btn-secondary w-full sm:w-auto">
            <Server class="w-4 h-4 text-slate-500" :class="{ 'animate-pulse': isTestingSupabase }" />
            <span>{{ isTestingSupabase ? 'Menguji koneksi...' : 'Uji Koneksi Supabase' }}</span>
          </button>
          <p
            v-if="testResultSuccess !== null"
            class="text-[13px] font-semibold px-3 py-2 rounded-xl"
            :class="testResultSuccess ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'"
            role="status"
          >
            {{ testResultMessage }}
          </p>
        </div>

        <details class="group rounded-2xl bg-slate-50 border border-slate-200 text-[13px] text-slate-600">
          <summary class="list-none cursor-pointer flex items-center justify-between gap-2 px-3.5 min-h-[48px] font-semibold text-slate-800">
            <span class="flex items-center gap-2">
              <Sparkles class="w-4 h-4 text-emerald-600 shrink-0" />
              Tips: auto-connect di semua device
            </span>
            <ChevronRight class="w-4 h-4 text-slate-400 transition-transform group-open:rotate-90 shrink-0" />
          </summary>
          <div class="px-3.5 pb-3.5 space-y-2 text-xs leading-relaxed">
            <p>Agar tidak perlu mengetik ulang URL & Anon Key setiap membuka dari HP atau laptop lain:</p>
            <ol class="list-decimal pl-5 space-y-1.5">
              <li>Buka <a href="https://vercel.com" target="_blank" rel="noopener" class="text-emerald-700 underline font-semibold">Vercel Dashboard</a> › project <strong>joobapp</strong> › <strong>Settings</strong> › <strong>Environment Variables</strong>.</li>
              <li>Tambahkan:
                <div class="mt-1 space-y-1">
                  <code class="block w-fit bg-slate-200 px-1.5 py-0.5 rounded text-[11px] font-mono break-all">VITE_SUPABASE_URL</code>
                  <code class="block w-fit bg-slate-200 px-1.5 py-0.5 rounded text-[11px] font-mono break-all">VITE_SUPABASE_ANON_KEY</code>
                </div>
              </li>
              <li>Semua device yang membuka website otomatis tersambung ke database Anda.</li>
            </ol>
          </div>
        </details>
      </div>
    </section>

    <!-- AI Provider -->
    <section id="set-ai" class="clean-card card-pad space-y-4 scroll-mt-32 lg:scroll-mt-6">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 shrink-0 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600">
          <Cpu class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <h2 class="section-title">Mesin AI Utama</h2>
          <p class="section-desc">Provider untuk membaca gambar lowongan dan mempersonalisasi surat.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3" role="radiogroup" aria-label="Pilih provider AI">
        <label
          v-for="opt in providerOptions"
          :key="opt.value"
          class="relative p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex sm:flex-col gap-3 sm:gap-2 active:scale-[0.99] focus-within:ring-2 focus-within:ring-indigo-500/40"
          :class="aiProviderInput === opt.value
            ? (opt.tone === 'amber' ? 'border-amber-500 bg-amber-50/50' : 'border-indigo-600 bg-indigo-50/50')
            : 'border-slate-200 hover:border-slate-300 bg-white'"
        >
          <input type="radio" :value="opt.value" v-model="aiProviderInput" class="sr-only" />
          <div
            class="w-10 h-10 sm:w-8 sm:h-8 shrink-0 rounded-xl flex items-center justify-center"
            :class="opt.tone === 'amber' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'"
          >
            <component :is="opt.icon" class="w-5 h-5 sm:w-4 sm:h-4" />
          </div>
          <div class="flex-1 min-w-0 pr-7 sm:pr-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-bold text-slate-900">{{ opt.title }}</span>
              <span
                class="text-[10px] font-bold uppercase tracking-wide"
                :class="opt.tone === 'amber' ? 'text-amber-600' : 'text-indigo-600'"
              >{{ opt.tag }}</span>
            </div>
            <p class="text-xs text-slate-500 leading-snug mt-1">{{ opt.desc }}</p>
          </div>
          <!-- Radio indicator -->
          <span
            class="absolute top-3.5 right-3.5 w-5 h-5 rounded-full border-2 flex items-center justify-center"
            :class="aiProviderInput === opt.value
              ? (opt.tone === 'amber' ? 'border-amber-500' : 'border-indigo-600')
              : 'border-slate-300'"
          >
            <span
              v-if="aiProviderInput === opt.value"
              class="w-2.5 h-2.5 rounded-full"
              :class="opt.tone === 'amber' ? 'bg-amber-500' : 'bg-indigo-600'"
            ></span>
          </span>
        </label>
      </div>
    </section>

    <!-- Groq -->
    <section id="set-groq" class="clean-card card-pad space-y-5 scroll-mt-32 lg:scroll-mt-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex items-start gap-3 min-w-0">
          <div class="w-10 h-10 shrink-0 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Zap class="w-5 h-5" />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="section-title">Groq Cloud API Key</h2>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                Multi-Key
              </span>
            </div>
            <p class="section-desc">Inference LPU ultra cepat — Llama 3.2 Vision & Llama 3.3 70B.</p>
          </div>
        </div>
        <a
          href="https://console.groq.com/keys"
          target="_blank"
          rel="noopener"
          class="btn-ghost btn-sm text-amber-700 hover:bg-amber-50 self-start sm:self-auto -ml-3 sm:ml-0"
        >
          <span>Dapatkan Key Gratis</span>
          <ExternalLink class="w-4 h-4" />
        </a>
      </div>

      <div class="space-y-4">
        <div class="flex items-center justify-between gap-2">
          <p class="form-label !mb-0">
            Daftar API Key ({{ groqApiKeysInput.filter(k => k.trim()).length }} terdaftar)
          </p>
          <span class="text-[11px] text-slate-500 hidden sm:inline">Rotasi otomatis jika limit (429)</span>
        </div>

        <!-- Multi-key input rows -->
        <div class="space-y-3">
          <div v-for="(keyVal, index) in groqApiKeysInput" :key="index">
            <div class="flex items-center gap-2 mb-1.5">
              <span class="text-xs font-bold text-slate-500">Key #{{ index + 1 }}</span>
              <span
                v-if="index === 0"
                class="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded"
              >Primary</span>
              <span
                v-else
                class="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
              >Backup</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="relative flex-1 min-w-0">
                <Key class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  v-model="groqApiKeysInput[index]"
                  type="password"
                  autocomplete="off"
                  :placeholder="index === 0 ? 'gsk_... (Key Utama)' : 'gsk_... (Cadangan)'"
                  class="form-input form-input-mono pl-10"
                  :aria-label="`Groq API Key #${index + 1}`"
                />
              </div>
              <button
                type="button"
                @click="removeGroqKeyField(index)"
                :disabled="groqApiKeysInput.length === 1 && !groqApiKeysInput[0]"
                class="btn-icon-danger border border-slate-200"
                :aria-label="`Hapus key #${index + 1}`"
                title="Hapus Key ini"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          @click="addGroqKeyField"
          class="btn btn-sm w-full sm:w-auto border border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-50 text-amber-700"
        >
          <Plus class="w-4 h-4" />
          <span>Tambah API Key Lainnya</span>
        </button>

        <div class="flex flex-col sm:flex-row sm:items-center gap-3 pt-4 border-t border-slate-100">
          <button @click="handleTestGroq()" :disabled="isTestingGroq" class="btn-secondary w-full sm:w-auto">
            <Zap class="w-4 h-4 text-amber-500" :class="{ 'animate-pulse': isTestingGroq }" />
            <span>{{ isTestingGroq ? 'Menguji koneksi Groq...' : 'Uji Koneksi Groq' }}</span>
          </button>
          <p
            v-if="testGroqSuccess !== null"
            class="text-[13px] font-semibold px-3 py-2 rounded-xl"
            :class="testGroqSuccess ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'"
            role="status"
          >
            {{ testGroqMessage }}
          </p>
        </div>

        <details class="group rounded-2xl bg-amber-50/60 border border-amber-200/80 text-[13px]">
          <summary class="list-none cursor-pointer flex items-center justify-between gap-2 px-3.5 min-h-[48px] font-semibold text-amber-900">
            <span class="flex items-center gap-2">
              <Zap class="w-4 h-4 text-amber-600 shrink-0" />
              Rotasi multi-key & cara dapat key
            </span>
            <ChevronRight class="w-4 h-4 text-amber-700 transition-transform group-open:rotate-90 shrink-0" />
          </summary>
          <div class="px-3.5 pb-3.5 space-y-3 text-xs leading-relaxed text-amber-900">
            <p>
              Masukkan beberapa API Key (bisa dari akun berbeda). Jika satu key terkena rate limit (HTTP 429), sistem <strong>otomatis beralih ke key cadangan</strong> tanpa membuat proses gagal.
            </p>
            <ol class="list-decimal pl-5 space-y-1 text-slate-700">
              <li>Kunjungi <a href="https://console.groq.com/keys" target="_blank" rel="noopener" class="text-amber-700 underline font-semibold">console.groq.com/keys</a> dan login.</li>
              <li>Klik <strong>"Create API Key"</strong>.</li>
              <li>Salin key berawalan <code class="bg-white px-1 py-0.5 rounded text-[11px] font-mono">gsk_...</code> lalu paste di atas.</li>
            </ol>
          </div>
        </details>
      </div>
    </section>

    <!-- Gemini -->
    <section id="set-gemini" class="clean-card card-pad space-y-5 scroll-mt-32 lg:scroll-mt-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex items-start gap-3 min-w-0">
          <div class="w-10 h-10 shrink-0 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Sparkles class="w-5 h-5" />
          </div>
          <div class="min-w-0">
            <h2 class="section-title">Google Gemini API Key</h2>
            <p class="section-desc">Gemini 3.8 Flash & 2.0 Flash untuk analisis gambar lowongan.</p>
          </div>
        </div>
        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noopener"
          class="btn-ghost btn-sm text-indigo-600 hover:bg-indigo-50 self-start sm:self-auto -ml-3 sm:ml-0"
        >
          <span>Dapatkan Key Gratis</span>
          <ExternalLink class="w-4 h-4" />
        </a>
      </div>

      <div class="space-y-4">
        <div>
          <label class="form-label" for="gm-key">API Key Gemini</label>
          <div class="relative">
            <Key class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="gm-key"
              v-model="apiKeyInput"
              type="password"
              autocomplete="off"
              placeholder="AIzaSy..."
              class="form-input form-input-mono pl-10"
            />
          </div>
        </div>

        <details class="group rounded-2xl bg-slate-50 border border-slate-200 text-[13px] text-slate-600">
          <summary class="list-none cursor-pointer flex items-center justify-between gap-2 px-3.5 min-h-[48px] font-semibold text-slate-800">
            <span>Cara mendapatkan Gemini API Key</span>
            <ChevronRight class="w-4 h-4 text-slate-400 transition-transform group-open:rotate-90 shrink-0" />
          </summary>
          <ol class="list-decimal pl-9 pr-4 pb-3.5 space-y-1 text-xs leading-relaxed">
            <li>Buka <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" class="text-indigo-600 underline font-semibold">Google AI Studio</a> dan login.</li>
            <li>Klik <strong>"Create API Key"</strong>.</li>
            <li>Salin & paste di atas, lalu tekan <strong>Simpan Pengaturan</strong>.</li>
          </ol>
        </details>
      </div>
    </section>

    <!-- Backup & Restore -->
    <section id="set-backup" class="clean-card card-pad space-y-4 scroll-mt-32 lg:scroll-mt-6">
      <div>
        <h2 class="section-title">
          <Download class="w-4 h-4 text-indigo-600 shrink-0" />
          <span>Cadangan & Pemulihan Data</span>
        </h2>
        <p class="section-desc">Ekspor data CV, portofolio & riwayat lamaran ke file JSON, atau pulihkan kapan saja.</p>
      </div>

      <div class="grid grid-cols-1 sm:flex sm:flex-wrap gap-2.5">
        <button @click="handleExportBackup" class="btn-secondary">
          <Download class="w-4 h-4 text-slate-500" />
          <span>Download Backup JSON</span>
        </button>
        <label class="btn-secondary cursor-pointer">
          <Upload class="w-4 h-4 text-slate-500" />
          <span>Import / Restore Backup</span>
          <input type="file" accept=".json,application/json" class="hidden" @change="handleImportBackup" />
        </label>
      </div>
    </section>

    <!-- Save (desktop) -->
    <div class="hidden lg:flex justify-end pt-2">
      <button @click="handleSaveSettings" class="btn-primary px-6">
        <Check class="w-4 h-4" />
        <span>Simpan Semua Pengaturan</span>
      </button>
    </div>

    <!-- Save (mobile sticky) -->
    <div class="mobile-action-bar">
      <div class="max-w-3xl mx-auto">
        <button @click="handleSaveSettings" class="btn-primary w-full">
          <Check class="w-4 h-4" />
          <span>Simpan Pengaturan</span>
        </button>
      </div>
    </div>
  </div>
</template>
