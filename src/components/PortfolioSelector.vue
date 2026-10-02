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
  <div class="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
    <div class="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <span class="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
        <h3 class="font-semibold text-xs sm:text-sm text-slate-800">Pilih Portofolio untuk Lowongan Ini</h3>
      </div>
      <span class="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
        {{ selectedIds.length }} dari {{ portfolios.length }} dipilih
      </span>
    </div>

    <div class="p-6 overflow-y-auto flex-1 bg-slate-50/60 space-y-4">
      <div
        v-for="item in portfolios"
        :key="item.id"
        @click="emit('toggle', item.id)"
        class="group relative flex flex-col md:flex-row gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-150"
        :class="selectedIds.includes(item.id) 
          ? 'bg-white border-2 border-indigo-600 shadow-xs ring-2 ring-indigo-100' 
          : 'bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs'"
      >
        <!-- Selection Checkbox -->
        <div class="absolute top-3.5 right-3.5">
          <div
            class="w-5 h-5 rounded-md flex items-center justify-center transition-colors"
            :class="selectedIds.includes(item.id) ? 'bg-indigo-600 text-white' : 'border border-slate-300 group-hover:border-slate-400 bg-slate-50'"
          >
            <Check v-if="selectedIds.includes(item.id)" class="w-3.5 h-3.5 stroke-[3]" />
          </div>
        </div>

        <!-- Project Details -->
        <div class="flex-1 min-w-0 pr-6">
          <div class="flex items-center gap-2">
            <h4 class="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
              {{ item.title }}
            </h4>
            <span v-if="item.category" class="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              {{ item.category }}
            </span>
          </div>

          <p class="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
            {{ item.description }}
          </p>

          <!-- Tech stack tags -->
          <div class="flex flex-wrap gap-1.5 mt-2.5">
            <span
              v-for="(tech, i) in item.technologies"
              :key="i"
              class="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
            >
              {{ tech }}
            </span>
          </div>

          <!-- Links -->
          <div class="flex items-center gap-3 mt-3 text-xs" @click.stop>
            <a
              v-if="item.demoUrl"
              :href="item.demoUrl"
              target="_blank"
              class="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <ExternalLink class="w-3.5 h-3.5" /> Live Demo
            </a>
            <a
              v-if="item.repoUrl"
              :href="item.repoUrl"
              target="_blank"
              class="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium"
            >
              <Github class="w-3.5 h-3.5" /> Repository
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
