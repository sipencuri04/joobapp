<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import BottomNav from './components/BottomNav.vue'
import { useSettingsStore } from './stores/settings'
import { useProfileStore } from './stores/profile'
import { Sparkles, Check, PanelRightOpen } from 'lucide-vue-next'

const mobileOpen = ref(false)
const route = useRoute()
const settingsStore = useSettingsStore()
const profileStore = useProfileStore()
const autoFetchNotice = ref('')

const pageTitles = {
  '/': 'Scan & Apply',
  '/templates': 'CV & Portofolio',
  '/tracker': 'Job Tracker',
  '/settings': 'Pengaturan'
}
const pageTitle = computed(() => pageTitles[route.path] || 'AutoApply Pro')

// Tutup drawer saat berpindah halaman
watch(() => route.path, () => { mobileOpen.value = false })

// Kunci scroll body saat drawer terbuka
watch(mobileOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

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
    <!-- Mobile App Bar -->
    <header class="lg:hidden sticky top-0 z-40 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div class="h-full max-w-3xl mx-auto px-4 flex items-center justify-between gap-3">
        <div class="flex items-center gap-2.5 min-w-0">
          <router-link
            to="/"
            class="w-9 h-9 shrink-0 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200"
            aria-label="Beranda AutoApply Pro"
          >
            <Sparkles class="w-[18px] h-[18px]" />
          </router-link>
          <div class="min-w-0 leading-tight">
            <p class="text-[11px] font-semibold text-slate-400 tracking-wide">AutoApply<span class="text-indigo-600">Pro</span></p>
            <h1 class="text-[15px] font-bold text-slate-900 truncate">{{ pageTitle }}</h1>
          </div>
        </div>

        <button
          @click="mobileOpen = true"
          class="relative btn-icon -mr-2 text-slate-600"
          aria-label="Buka panel status & menu"
        >
          <PanelRightOpen class="w-5 h-5" />
          <span
            class="absolute top-2.5 right-2.5 w-2 h-2 rounded-full ring-2 ring-white"
            :class="settingsStore.hasSupabase && settingsStore.hasAnyAiKey ? 'bg-emerald-500' : 'bg-amber-500'"
          />
        </button>
      </div>
    </header>

    <!-- Sidebar (Desktop) & Drawer (Mobile) -->
    <Sidebar
      :mobile-open="mobileOpen"
      @close="mobileOpen = false"
    />

    <!-- Main Content Area -->
    <div class="flex-1 min-w-0 flex flex-col min-h-screen">
      <!-- Auto-fetch Notification (toast) -->
      <transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="-translate-y-3 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="-translate-y-3 opacity-0"
      >
        <div
          v-if="autoFetchNotice"
          class="toast bg-emerald-600 text-white"
          role="status"
        >
          <Check class="w-4 h-4 mt-0.5 shrink-0" />
          <span>{{ autoFetchNotice }}</span>
        </div>
      </transition>

      <!-- View Router -->
      <main class="flex-1 w-full max-w-3xl lg:max-w-7xl mx-auto px-4 pt-4 pb-28 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8 lg:pb-10">
        <router-view />
      </main>

      <!-- Footer (desktop only — di mobile ruang layar diprioritaskan untuk konten) -->
      <footer class="hidden lg:block border-t border-slate-200/80 bg-white py-4 px-8 text-xs text-slate-500">
        <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <p class="font-medium text-slate-600">
            AutoApply Pro • Sistem Otomasi Lamaran Pekerjaan (CV, Portofolio & Cover Letter)
          </p>
          <p class="text-[11px] text-slate-400">
            Terhubung dengan Supabase Cloud & Google Gemini AI Vision
          </p>
        </div>
      </footer>
    </div>

    <!-- Bottom Navigation (mobile & tablet) -->
    <BottomNav />
  </div>
</template>
