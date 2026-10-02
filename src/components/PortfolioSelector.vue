<script setup>
import { Check, ExternalLink, Github, Sparkles } from 'lucide-vue-next'

const props = defineProps({
  portfolios: {
    type: Array,
    default: () => []
  },
  selectedIds: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['toggle'])
</script>

<template>
  <div class="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
    <div class="px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 min-w-0">
        <span class="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0"></span>
        <h3 class="font-semibold text-sm text-slate-800 truncate">
          <span class="sm:hidden">Pilih Portofolio</span>
          <span class="hidden sm:inline">Pilih Portofolio untuk Lowongan Ini</span>
        </h3>
      </div>
      <span class="shrink-0 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg">
        {{ selectedIds.length }}/{{ portfolios.length }} dipilih
      </span>
    </div>

    <div class="p-3 sm:p-5 xl:overflow-y-auto flex-1 bg-slate-50/60 space-y-3">
      <!-- Empty state -->
      <div v-if="portfolios.length === 0" class="text-center py-12 px-4">
        <Sparkles class="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p class="text-sm font-semibold text-slate-700">Belum ada portofolio</p>
        <p class="text-xs text-slate-500 mt-1">Tambahkan proyek di menu CV & Portofolio.</p>
      </div>

      <div
        v-for="item in portfolios"
        :key="item.id"
        @click="emit('toggle', item.id)"
        @keydown.enter.prevent="emit('toggle', item.id)"
        @keydown.space.prevent="emit('toggle', item.id)"
        role="checkbox"
        tabindex="0"
        :aria-checked="selectedIds.includes(item.id)"
        class="group relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-150 active:scale-[0.99] bg-white"
        :class="selectedIds.includes(item.id)
          ? 'border-indigo-600 ring-4 ring-indigo-100'
          : 'border-slate-200 hover:border-slate-300'"
      >
        <div class="flex items-start gap-3">
          <!-- Selection Checkbox -->
          <div
            class="mt-0.5 w-6 h-6 shrink-0 rounded-lg flex items-center justify-center transition-colors"
            :class="selectedIds.includes(item.id) ? 'bg-indigo-600 text-white' : 'border-2 border-slate-300 bg-white group-hover:border-slate-400'"
          >
            <Check v-if="selectedIds.includes(item.id)" class="w-4 h-4 stroke-[3]" />
          </div>

          <!-- Project Details -->
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h4 class="font-bold text-slate-900 text-sm leading-snug">
                {{ item.title }}
              </h4>
              <span v-if="item.category" class="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                {{ item.category }}
              </span>
            </div>

            <p class="text-[13px] text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
              {{ item.description }}
            </p>

            <!-- Tech stack tags -->
            <div v-if="item.technologies?.length" class="flex flex-wrap gap-1.5 mt-2.5">
              <span
                v-for="(tech, i) in item.technologies"
                :key="i"
                class="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
              >
                {{ tech }}
              </span>
            </div>

            <!-- Links -->
            <div v-if="item.demoUrl || item.repoUrl" class="flex items-center gap-1 mt-2 -ml-2 text-[13px]" @click.stop>
              <a
                v-if="item.demoUrl"
                :href="item.demoUrl"
                target="_blank"
                rel="noopener"
                class="inline-flex items-center gap-1.5 min-h-[40px] px-2 rounded-lg text-indigo-600 hover:bg-indigo-50 font-semibold"
              >
                <ExternalLink class="w-4 h-4" /> Demo
              </a>
              <a
                v-if="item.repoUrl"
                :href="item.repoUrl"
                target="_blank"
                rel="noopener"
                class="inline-flex items-center gap-1.5 min-h-[40px] px-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
              >
                <Github class="w-4 h-4" /> Repo
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
