<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useApplicationStore } from '../stores/applications'
import { useSettingsStore } from '../stores/settings'
import { Send, FileText, Briefcase, Settings } from 'lucide-vue-next'

const route = useRoute()
const appStore = useApplicationStore()
const settingsStore = useSettingsStore()

const items = computed(() => [
  { to: '/', label: 'Scan', icon: Send },
  { to: '/templates', label: 'CV & Porto', icon: FileText },
  { to: '/tracker', label: 'Tracker', icon: Briefcase, badge: appStore.applications.length || null },
  { to: '/settings', label: 'Setelan', icon: Settings, dot: !settingsStore.hasAnyAiKey || !settingsStore.hasSupabase }
])
</script>

<template>
  <nav
    class="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-nav pb-safe"
    aria-label="Navigasi utama"
  >
    <ul class="grid grid-cols-4 max-w-xl mx-auto h-16">
      <li v-for="item in items" :key="item.to">
        <router-link
          :to="item.to"
          class="relative h-full flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors active:bg-slate-100"
          :class="route.path === item.to ? 'text-indigo-700' : 'text-slate-500'"
          :aria-current="route.path === item.to ? 'page' : undefined"
        >
          <span
            class="relative flex items-center justify-center w-14 h-8 rounded-full transition-colors"
            :class="route.path === item.to ? 'bg-indigo-100' : ''"
          >
            <component :is="item.icon" class="w-5 h-5" :stroke-width="route.path === item.to ? 2.4 : 2" />
            <span
              v-if="item.badge"
              class="absolute -top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold leading-[18px] text-center ring-2 ring-white"
            >{{ item.badge > 99 ? '99+' : item.badge }}</span>
            <span
              v-else-if="item.dot"
              class="absolute top-0.5 right-3 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white"
            />
          </span>
          <span class="leading-none">{{ item.label }}</span>
        </router-link>
      </li>
    </ul>
  </nav>
</template>
