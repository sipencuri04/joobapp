<script setup>
import { ref, onMounted } from 'vue'
import Sidebar from './components/Sidebar.vue'
import { useSettingsStore } from './stores/settings'
import { useProfileStore } from './stores/profile'
import { Menu, Sparkles, Database, Check } from 'lucide-vue-next'

const mobileOpen = ref(false)
const settingsStore = useSettingsStore()
const profileStore = useProfileStore()
const autoFetchNotice = ref('')

onMounted(async () => {
  // Otomatis ambil data dari Supabase jika konfigurasi sudah ada
  if (settingsStore.hasSupabase) {
    try {
      const res = await profileStore.fetchFromSupabase()
      if (res && res.success) {
        autoFetchNotice.value = res.message
        setTimeout(() => {
          autoFetchNotice.value = ''
        }, 3500)
      }
    } catch (err) {
      console.warn('Auto fetch from Supabase skipped/failed:', err)
    }
  }
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-800 flex flex-col lg:flex-row font-sans selection:bg-indigo-600 selection:text-white">
    <!-- Top Mobile Navigation Header -->
    <header class="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
      <div class="flex items-center space-x-3">
        <button 
          @click="mobileOpen = true"
          class="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          aria-label="Buka Menu"
        >
          <Menu class="w-5 h-5" />
        </button>
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Sparkles class="w-4 h-4 text-white" />
          </div>
          <span class="font-extrabold text-slate-900 tracking-tight text-sm">
            AutoApply<span class="text-indigo-600">Pro</span>
          </span>
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <span 
          v-if="settingsStore.hasSupabase"
          class="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
        >
          <Database class="w-3 h-3 text-emerald-600" />
          <span>Supabase Aktif</span>
        </span>
      </div>
    </header>

    <!-- Sidebar (Desktop & Mobile Drawer) -->
    <Sidebar 
      :mobile-open="mobileOpen" 
      @close="mobileOpen = false" 
    />

    <!-- Main Content Area -->
    <div class="flex-1 min-w-0 flex flex-col min-h-screen">
      <!-- Auto-fetch Notification Banner -->
      <transition 
        enter-active-class="transition duration-300 ease-out" 
        enter-from-class="transform -translate-y-4 opacity-0" 
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform -translate-y-4 opacity-0"
      >
        <div 
          v-if="autoFetchNotice" 
          class="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs text-emerald-800 flex items-center justify-center space-x-2 shadow-xs"
        >
          <Check class="w-4 h-4 text-emerald-600" />
          <span class="font-medium">{{ autoFetchNotice }}</span>
        </div>
      </transition>

      <!-- View Router -->
      <main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <router-view />
      </main>

      <!-- Clean Footer -->
      <footer class="border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p class="font-medium text-slate-600">
            AutoApply Pro • Sistem Otomasi Lamaran Pekerjaan (CV, Portofolio & Cover Letter)
          </p>
          <p class="text-[11px] text-slate-400">
            Terhubung dengan Supabase Cloud & Google Gemini AI Vision
          </p>
        </div>
      </footer>
    </div>
  </div>
</template>
