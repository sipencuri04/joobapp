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

const navItems = computed(() => [
  { to: '/', label: 'Scan & Apply', icon: Send },
  { to: '/templates', label: 'CV & Portofolio', icon: FileText, count: portfolioCount.value || null },
  { to: '/tracker', label: 'Job Tracker', icon: Briefcase, count: pendingCount.value || null },
  { to: '/settings', label: 'Pengaturan', icon: Settings, warn: !settingsStore.hasAnyAiKey || !settingsStore.hasSupabase }
])

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
  <transition
    enter-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    leave-active-class="transition-opacity duration-150"
    leave-to-class="opacity-0"
  >
    <div
      v-if="mobileOpen"
      class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] lg:hidden"
      @click="emit('close')"
    />
  </transition>

  <!-- Sidebar (desktop) / Drawer kanan (mobile) -->
  <aside
    class="fixed top-0 right-0 z-[55] h-[100dvh] w-[86%] max-w-[320px] bg-white flex flex-col transition-transform duration-200 ease-out select-none shadow-2xl
           lg:sticky lg:right-auto lg:left-0 lg:z-30 lg:w-64 lg:max-w-none lg:border-r lg:border-slate-200 lg:shadow-none lg:translate-x-0"
    :class="mobileOpen ? 'translate-x-0' : 'translate-x-full'"
    aria-label="Navigasi & status"
  >
    <!-- Brand / Drawer header -->
    <div class="flex items-center justify-between px-4 pt-4 pb-3 lg:px-5 lg:pt-6 lg:pb-2">
      <router-link to="/" class="flex items-center gap-3 group min-w-0" @click="emit('close')">
        <div class="w-10 h-10 shrink-0 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
          <Sparkles class="w-5 h-5 text-indigo-100" />
        </div>
        <div class="min-w-0">
          <span class="block font-extrabold text-base tracking-tight text-slate-900">
            AutoApply<span class="text-indigo-600">Pro</span>
          </span>
          <p class="text-[11px] text-slate-500 font-medium truncate">AI Job Application Copilot</p>
        </div>
      </router-link>

      <button
        class="lg:hidden btn-icon -mr-2"
        @click="emit('close')"
        aria-label="Tutup panel"
      >
        <X class="w-5 h-5" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto overscroll-contain px-4 pb-4 lg:pt-4">
      <!-- Navigation Menu (desktop; di mobile digantikan bottom navigation) -->
      <nav class="hidden lg:block space-y-1" aria-label="Menu utama">
        <div class="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Menu Utama
        </div>

        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center justify-between min-h-[44px] px-3.5 rounded-xl text-sm font-medium transition-colors"
          :class="route.path === item.to
            ? 'bg-indigo-50 text-indigo-700 font-semibold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'"
        >
          <div class="flex items-center gap-3">
            <component :is="item.icon" class="w-[18px] h-[18px]" :class="route.path === item.to ? 'text-indigo-600' : 'text-slate-400'" />
            <span>{{ item.label }}</span>
          </div>
          <span
            v-if="item.count"
            class="text-[11px] px-1.5 py-0.5 rounded-md font-semibold"
            :class="item.to === '/tracker' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 border border-slate-200'"
          >
            {{ item.count }}
          </span>
          <span
            v-else-if="item.warn"
            class="w-2 h-2 rounded-full bg-amber-500"
            title="Ada konfigurasi yang belum diisi"
          />
        </router-link>
      </nav>

      <!-- Profile (mobile: tampil paling atas) -->
      <router-link
        to="/templates"
        @click="emit('close')"
        class="lg:hidden flex items-center gap-3 p-3 mb-4 rounded-2xl bg-slate-50 border border-slate-200 active:bg-slate-100"
      >
        <div class="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0">
          {{ (profileStore.profile.fullName || 'User').substring(0, 2).toUpperCase() }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-slate-900 truncate">{{ profileStore.profile.fullName || 'Nama Pelamar' }}</p>
          <p class="text-xs text-slate-500 truncate">{{ profileStore.profile.headline || 'Web Developer' }}</p>
        </div>
        <ChevronRight class="w-4 h-4 text-slate-400 shrink-0" />
      </router-link>

      <div class="lg:mt-8 lg:pt-5 lg:border-t lg:border-slate-100 space-y-3">
        <div class="px-1 lg:px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Status Sistem
        </div>

        <!-- Supabase Card -->
        <div class="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 text-xs">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-1.5">
              <Database class="w-4 h-4 text-indigo-600" />
              <span class="font-semibold text-sm text-slate-800">Supabase</span>
            </div>
            <span
              class="px-2 py-0.5 rounded-full text-[11px] font-semibold"
              :class="settingsStore.hasSupabase
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-200 text-slate-600'"
            >
              {{ settingsStore.hasSupabase ? 'Terkoneksi' : 'Belum Set' }}
            </span>
          </div>

          <p class="text-slate-500 text-xs leading-relaxed mb-3">
            {{ settingsStore.hasSupabase
              ? `${portfolioCount} portofolio tersinkron dari database Supabase.`
              : 'Hubungkan Supabase untuk menyimpan portofolio & riwayat.' }}
          </p>

          <button
            @click="triggerSupabaseRefresh"
            :disabled="profileStore.isFetchingSupabase"
            class="btn-secondary btn-sm w-full"
          >
            <RefreshCw
              class="w-4 h-4 text-slate-500"
              :class="{ 'animate-spin text-indigo-600': profileStore.isFetchingSupabase }"
            />
            <span>
              {{ profileStore.isFetchingSupabase ? 'Memuat Data...' : (settingsStore.hasSupabase ? 'Sinkron Supabase' : 'Atur Supabase') }}
            </span>
          </button>
        </div>

        <!-- AI Status Card -->
        <div class="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 text-xs">
          <div class="flex items-center justify-between mb-1">
            <div class="flex items-center gap-1.5">
              <component
                :is="settingsStore.effectiveAiProvider === 'groq' ? Zap : Sparkles"
                class="w-4 h-4"
                :class="settingsStore.effectiveAiProvider === 'groq' ? 'text-amber-500' : 'text-indigo-600'"
              />
              <span class="font-semibold text-sm text-slate-800">
                {{ settingsStore.effectiveAiProvider === 'groq' ? 'Groq LPU AI' : settingsStore.effectiveAiProvider === 'gemini' ? 'Gemini AI' : 'AI Copilot' }}
              </span>
            </div>
            <span
              class="w-2.5 h-2.5 rounded-full"
              :class="settingsStore.hasAnyAiKey ? 'bg-emerald-500' : 'bg-amber-500'"
            />
          </div>
          <p class="text-slate-500 text-xs leading-relaxed">
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
          <router-link
            v-if="!settingsStore.hasAnyAiKey"
            to="/settings"
            @click="emit('close')"
            class="btn-soft btn-sm w-full mt-3"
          >
            Buka Pengaturan
          </router-link>
        </div>
      </div>
    </div>

    <!-- Bottom User Profile Footer (desktop) -->
    <div class="hidden lg:block p-3 border-t border-slate-200 bg-slate-50/50">
      <router-link
        to="/templates"
        class="flex items-center justify-between p-2 rounded-xl hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 transition-all group"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
            {{ (profileStore.profile.fullName || 'User').substring(0, 2).toUpperCase() }}
          </div>
          <div class="min-w-0">
            <p class="text-xs font-semibold text-slate-900 truncate">
              {{ profileStore.profile.fullName || 'Nama Pelamar' }}
            </p>
            <p class="text-[11px] text-slate-500 truncate">
              {{ profileStore.profile.headline || 'Web Developer' }}
            </p>
          </div>
        </div>
        <ChevronRight class="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0" />
      </router-link>
    </div>
  </aside>
</template>
