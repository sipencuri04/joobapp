<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSettingsStore } from '../stores/settings'
import { useApplicationStore } from '../stores/applications'
import { useProfileStore } from '../stores/profile'
import { 
  Sparkles, 
  FileText, 
  Settings, 
  Briefcase, 
  Send,
  Database,
  Key,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  User,
  Zap,
  X
} from 'lucide-vue-next'

const props = defineProps({
  mobileOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const router = useRouter()
const route = useRoute()
const settingsStore = useSettingsStore()
const appStore = useApplicationStore()
const profileStore = useProfileStore()

const pendingCount = computed(() => appStore.applications.length)
const portfolioCount = computed(() => profileStore.portfolios.length)

async function triggerSupabaseRefresh() {
  if (!settingsStore.hasSupabase) {
    router.push('/settings')
    return
  }
  try {
    const res = await profileStore.fetchFromSupabase()
    alert(res.message || 'Data Supabase berhasil diperbarui!')
  } catch (err) {
    alert('Gagal memuat data dari Supabase: ' + err.message)
  }
}
</script>

<template>
  <!-- Mobile Backdrop Overlay -->
  <div 
    v-if="mobileOpen" 
    class="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
    @click="emit('close')"
  />

  <!-- Sidebar Container -->
  <aside 
    class="fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out select-none shadow-sm lg:shadow-none"
    :class="mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
  >
    <!-- Top Section: Brand & Nav Links -->
    <div class="flex-1 overflow-y-auto px-4 py-5">
      <!-- Brand Logo Header -->
      <div class="flex items-center justify-between mb-8 px-1">
        <router-link to="/" class="flex items-center space-x-3 group" @click="emit('close')">
          <div class="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
            <Sparkles class="w-5 h-5 text-indigo-100" />
          </div>
          <div>
            <div class="flex items-center space-x-1.5">
              <span class="font-extrabold text-base tracking-tight text-slate-900">
                AutoApply<span class="text-indigo-600">Pro</span>
              </span>
            </div>
            <p class="text-[11px] text-slate-500 font-medium">AI Job Application Copilot</p>
          </div>
        </router-link>

        <!-- Close button for mobile -->
        <button 
          class="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          @click="emit('close')"
          aria-label="Tutup menu"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Navigation Menu -->
      <nav class="space-y-1">
        <div class="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Menu Utama
        </div>

        <!-- 1. Scan & Apply -->
        <router-link
          to="/"
          @click="emit('close')"
          class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="route.path === '/' 
            ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs' 
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'"
        >
          <div class="flex items-center space-x-3">
            <Send class="w-4 h-4" :class="route.path === '/' ? 'text-indigo-600' : 'text-slate-400'" />
            <span>Scan & Apply</span>
          </div>
          <span 
            v-if="route.path === '/'" 
            class="w-1.5 h-1.5 rounded-full bg-indigo-600"
          />
        </router-link>

        <!-- 2. CV & Portofolio (Supabase Data) -->
        <router-link
          to="/templates"
          @click="emit('close')"
          class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="route.path === '/templates' 
            ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs' 
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'"
        >
          <div class="flex items-center space-x-3">
            <FileText class="w-4 h-4" :class="route.path === '/templates' ? 'text-indigo-600' : 'text-slate-400'" />
            <span>CV & Portofolio</span>
          </div>
          <span 
            v-if="portfolioCount > 0"
            class="text-[11px] px-1.5 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-600 border border-slate-200"
            title="Jumlah Portofolio"
          >
            {{ portfolioCount }}
          </span>
        </router-link>

        <!-- 3. Job Tracker -->
        <router-link
          to="/tracker"
          @click="emit('close')"
          class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="route.path === '/tracker' 
            ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs' 
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'"
        >
          <div class="flex items-center space-x-3">
            <Briefcase class="w-4 h-4" :class="route.path === '/tracker' ? 'text-indigo-600' : 'text-slate-400'" />
            <span>Job Tracker</span>
          </div>
          <span 
            v-if="pendingCount > 0" 
            class="text-[11px] px-1.5 py-0.5 rounded-md font-semibold bg-indigo-100 text-indigo-700"
          >
            {{ pendingCount }}
          </span>
        </router-link>

        <!-- 4. Pengaturan -->
        <router-link
          to="/settings"
          @click="emit('close')"
          class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="route.path === '/settings' 
            ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs' 
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'"
        >
          <div class="flex items-center space-x-3">
            <Settings class="w-4 h-4" :class="route.path === '/settings' ? 'text-indigo-600' : 'text-slate-400'" />
            <span>Pengaturan</span>
          </div>
          <span 
            v-if="!settingsStore.hasAnyAiKey || !settingsStore.hasSupabase" 
            class="w-2 h-2 rounded-full bg-amber-500" 
            title="Ada konfigurasi yang belum diisi"
          />
        </router-link>
      </nav>

      <!-- Supabase Card Integration -->
      <div class="mt-8 pt-5 border-t border-slate-100">
        <div class="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>Database Cloud</span>
          <span 
            class="w-2 h-2 rounded-full"
            :class="settingsStore.hasSupabase ? 'bg-emerald-500' : 'bg-slate-300'"
          />
        </div>

        <div class="bg-slate-50 border border-slate-200/90 rounded-xl p-3 text-xs">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-1.5">
              <Database class="w-3.5 h-3.5 text-indigo-600" />
              <span class="font-semibold text-slate-800">Supabase</span>
            </div>
            <span 
              class="px-2 py-0.5 rounded text-[10px] font-semibold"
              :class="settingsStore.hasSupabase 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                : 'bg-slate-200 text-slate-600'"
            >
              {{ settingsStore.hasSupabase ? 'Terkoneksi' : 'Belum Set' }}
            </span>
          </div>

          <p class="text-slate-500 text-[11px] leading-relaxed mb-2.5">
            {{ settingsStore.hasSupabase 
              ? `${portfolioCount} portofolio tersinkron dari database Supabase.` 
              : 'Hubungkan Supabase untuk menyimpan portofolio & riwayat.' }}
          </p>

          <button 
            @click="triggerSupabaseRefresh"
            :disabled="profileStore.isFetchingSupabase"
            class="w-full flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-700 font-medium border border-slate-200 rounded-lg shadow-xs transition-colors"
          >
            <RefreshCw 
              class="w-3.5 h-3.5 text-slate-500" 
              :class="{ 'animate-spin text-indigo-600': profileStore.isFetchingSupabase }"
            />
            <span class="text-[11px]">
              {{ profileStore.isFetchingSupabase ? 'Memuat Data...' : 'Sinkron Supabase' }}
            </span>
          </button>
        </div>
      </div>

      <!-- AI Status Badge (Groq / Gemini) -->
      <div class="mt-4">
        <div class="bg-slate-50 border border-slate-200/90 rounded-xl p-3 text-xs">
          <div class="flex items-center justify-between mb-1">
            <div class="flex items-center space-x-1.5">
              <component 
                :is="settingsStore.effectiveAiProvider === 'groq' ? Zap : Sparkles" 
                class="w-3.5 h-3.5" 
                :class="settingsStore.effectiveAiProvider === 'groq' ? 'text-amber-500' : 'text-indigo-600'" 
              />
              <span class="font-semibold text-slate-800">
                {{ settingsStore.effectiveAiProvider === 'groq' ? 'Groq LPU AI' : settingsStore.effectiveAiProvider === 'gemini' ? 'Gemini AI' : 'AI Copilot' }}
              </span>
            </div>
            <span 
              class="w-2 h-2 rounded-full"
              :class="settingsStore.hasAnyAiKey ? 'bg-emerald-500' : 'bg-amber-500'"
            />
          </div>
          <p class="text-slate-500 text-[11px] leading-relaxed">
            <span v-if="settingsStore.effectiveAiProvider === 'groq'">
              Llama 3.2 Vision & Llama 3.3 aktif (ultra cepat).
            </span>
            <span v-else-if="settingsStore.effectiveAiProvider === 'gemini'">
              Gemini 3.8 Flash aktif.
            </span>
            <span v-else>
              Perlu API Key Groq/Gemini di Pengaturan.
            </span>
          </p>
        </div>
      </div>
    </div>

    <!-- Bottom User Profile Footer -->
    <div class="p-3 border-t border-slate-200 bg-slate-50/50">
      <router-link 
        to="/templates" 
        @click="emit('close')"
        class="flex items-center justify-between p-2 rounded-xl hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 transition-all group"
      >
        <div class="flex items-center space-x-2.5 min-w-0">
          <div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
            {{ (profileStore.profile.fullName || 'User').substring(0, 2).toUpperCase() }}
          </div>
          <div class="min-w-0">
            <p class="text-xs font-semibold text-slate-900 truncate">
              {{ profileStore.profile.fullName || 'Nama Pelamar' }}
            </p>
            <p class="text-[10px] text-slate-500 truncate">
              {{ profileStore.profile.headline || 'Web Developer' }}
            </p>
          </div>
        </div>
        <ChevronRight class="w-4 h-4 text-slate-400 group-hover:text-slate-600 flex-shrink-0" />
      </router-link>
    </div>
  </aside>
</template>
