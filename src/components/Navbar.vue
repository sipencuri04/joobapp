<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSettingsStore } from '../stores/settings'
import { useApplicationStore } from '../stores/applications'
import { 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  Settings, 
  Briefcase, 
  Send,
  Database,
  Key
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const settingsStore = useSettingsStore()
const appStore = useApplicationStore()

const pendingCount = computed(() => {
  return appStore.applications.length
})
</script>

<template>
  <header class="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo & Brand -->
        <router-link to="/" class="flex items-center space-x-3 group">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-[2px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <div class="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles class="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                AutoApply<span class="text-indigo-400">Pro</span>
              </span>
              <span class="text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                AI Copilot
              </span>
            </div>
            <p class="text-xs text-slate-400 hidden sm:block">Automasi Lamaran: CV • Porto • Surat Lamaran</p>
          </div>
        </router-link>

        <!-- Navigation Links -->
        <nav class="hidden md:flex items-center space-x-1 lg:space-x-2">
          <router-link
            to="/"
            class="flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
            :class="route.path === '/' 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'"
          >
            <Send class="w-4 h-4" />
            <span>Scan & Apply</span>
          </router-link>

          <router-link
            to="/templates"
            class="flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
            :class="route.path === '/templates' 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'"
          >
            <FileText class="w-4 h-4" />
            <span>CV & Portofolio</span>
          </router-link>

          <router-link
            to="/tracker"
            class="flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all relative"
            :class="route.path === '/tracker' 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'"
          >
            <Briefcase class="w-4 h-4" />
            <span>Job Tracker</span>
            <span v-if="pendingCount > 0" class="text-xs bg-slate-800 text-indigo-300 font-bold px-1.5 py-0.5 rounded-full border border-indigo-500/30">
              {{ pendingCount }}
            </span>
          </router-link>

          <router-link
            to="/settings"
            class="flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
            :class="route.path === '/settings' 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'"
          >
            <Settings class="w-4 h-4" />
            <span>Pengaturan</span>
          </router-link>
        </nav>

        <!-- Status Badges & Quick Action -->
        <div class="flex items-center space-x-3">
          <!-- Gemini Key Status Indicator -->
          <router-link 
            to="/settings" 
            class="hidden sm:flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full border transition-all"
            :class="settingsStore.hasGeminiKey 
              ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300' 
              : 'bg-amber-950/60 border-amber-500/30 text-amber-300 hover:border-amber-400'"
            :title="settingsStore.hasGeminiKey ? 'Gemini AI Vision Terhubung' : 'Klik untuk pasang Gemini API Key'"
          >
            <Key class="w-3.5 h-3.5" />
            <span class="font-medium">{{ settingsStore.hasGeminiKey ? 'AI Siap' : 'Set Gemini Key' }}</span>
          </router-link>

          <!-- Supabase Status Indicator -->
          <router-link 
            to="/settings" 
            class="hidden sm:flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full border transition-all"
            :class="settingsStore.hasSupabase 
              ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300' 
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'"
            :title="settingsStore.hasSupabase ? 'Tersambung Supabase' : 'Penyimpanan Lokal Aktif (Opsional Supabase)'"
          >
            <Database class="w-3.5 h-3.5" />
            <span class="font-medium">{{ settingsStore.hasSupabase ? 'Supabase' : 'Lokal' }}</span>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Mobile Navigation Bar -->
    <div class="md:hidden flex border-t border-slate-800 bg-slate-900/95 px-2 py-2 justify-around">
      <router-link
        to="/"
        class="flex flex-col items-center py-1 px-3 text-xs rounded-lg"
        :class="route.path === '/' ? 'text-indigo-400 font-semibold' : 'text-slate-400'"
      >
        <Send class="w-5 h-5 mb-1" />
        <span>Scan</span>
      </router-link>
      <router-link
        to="/templates"
        class="flex flex-col items-center py-1 px-3 text-xs rounded-lg"
        :class="route.path === '/templates' ? 'text-indigo-400 font-semibold' : 'text-slate-400'"
      >
        <FileText class="w-5 h-5 mb-1" />
        <span>CV & Porto</span>
      </router-link>
      <router-link
        to="/tracker"
        class="flex flex-col items-center py-1 px-3 text-xs rounded-lg"
        :class="route.path === '/tracker' ? 'text-indigo-400 font-semibold' : 'text-slate-400'"
      >
        <Briefcase class="w-5 h-5 mb-1" />
        <span>Tracker</span>
      </router-link>
      <router-link
        to="/settings"
        class="flex flex-col items-center py-1 px-3 text-xs rounded-lg"
        :class="route.path === '/settings' ? 'text-indigo-400 font-semibold' : 'text-slate-400'"
      >
        <Settings class="w-5 h-5 mb-1" />
        <span>Setting</span>
      </router-link>
    </div>
  </header>
</template>
