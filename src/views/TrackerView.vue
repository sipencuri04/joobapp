<script setup>
import { ref, computed } from 'vue'
import { useApplicationStore } from '../stores/applications'
import { cleanIndonesianPhoneNumber } from '../services/gemini'
import { 
  Briefcase, 
  Search, 
  Filter, 
  Mail, 
  Phone,
  MessageSquare, 
  Trash2, 
  Calendar, 
  Building, 
  ExternalLink,
  ChevronDown,
  Download,
  CheckCircle2,
  Send
} from 'lucide-vue-next'

const appStore = useApplicationStore()

const searchQuery = ref('')
const selectedStatus = ref('ALL')

const statusOptions = ['Draft', 'Applied', 'Interview', 'Offered', 'Rejected']

const filteredApplications = computed(() => {
  return appStore.applications.filter(app => {
    const matchesStatus = selectedStatus.value === 'ALL' || app.status === selectedStatus.value
    const query = searchQuery.value.toLowerCase()
    const matchesQuery = !query || 
      app.companyName.toLowerCase().includes(query) || 
      app.positionTitle.toLowerCase().includes(query) ||
      (app.contactEmail && app.contactEmail.toLowerCase().includes(query))
    return matchesStatus && matchesQuery
  })
})

const statusCounts = computed(() => {
  const counts = { ALL: appStore.applications.length }
  statusOptions.forEach(st => { counts[st] = 0 })
  appStore.applications.forEach(a => {
    if (counts[a.status] !== undefined) counts[a.status]++
  })
  return counts
})

const isFiltering = computed(() => Boolean(searchQuery.value) || selectedStatus.value !== 'ALL')

function resetFilters() {
  searchQuery.value = ''
  selectedStatus.value = 'ALL'
}

function getStatusDotClass(status) {
  switch (status) {
    case 'Applied': return 'bg-blue-500'
    case 'Interview': return 'bg-amber-500'
    case 'Offered': return 'bg-emerald-500'
    case 'Rejected': return 'bg-rose-500'
    default: return 'bg-slate-400'
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'Draft': return 'bg-slate-100 text-slate-700 border-slate-200'
    case 'Applied': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'Interview': return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'Offered': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-200'
    default: return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return dateStr
  }
}

function openGmail(app) {
  const to = encodeURIComponent(app.contactEmail || '')
  const su = encodeURIComponent(app.tailoredEmailSubject || `Lamaran Pekerjaan - ${app.positionTitle}`)
  const body = encodeURIComponent(app.tailoredCoverLetter || '')
  window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${body}`, '_blank')
}

function openWhatsApp(app) {
  const phone = cleanIndonesianPhoneNumber(app.contactPhone || '')
  const text = encodeURIComponent(app.tailoredWhatsAppMessage || '')
  window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
}

function handleDelete(id) {
  if (confirm('Hapus lamaran ini dari riwayat?')) {
    appStore.deleteApplication(id)
  }
}

function exportCsv() {
  if (appStore.applications.length === 0) {
    alert('Belum ada data lamaran untuk diexport.')
    return
  }

  const headers = ['Perusahaan', 'Posisi', 'Email', 'No HP', 'Status', 'Tanggal Apply', 'Catatan']
  const rows = appStore.applications.map(a => [
    `"${a.companyName || ''}"`,
    `"${a.positionTitle || ''}"`,
    `"${a.contactEmail || ''}"`,
    `"${a.contactPhone || ''}"`,
    `"${a.status || ''}"`,
    `"${formatDate(a.appliedAt)}"`,
    `"${(a.notes || '').replace(/"/g, '""')}"`
  ])

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `Job_Applications_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between gap-3 lg:pb-4 lg:border-b lg:border-slate-200">
      <div class="min-w-0">
        <h1 class="page-title hidden lg:block">Job Application Tracker</h1>
        <p class="page-subtitle !mt-0 lg:!mt-1">
          <span class="lg:hidden">{{ appStore.applications.length }} lamaran tercatat</span>
          <span class="hidden lg:inline">Pantau seluruh status lamaran, rekruter yang telah dihubungi, dan catatan tindak lanjut.</span>
        </p>
      </div>
      <button
        @click="exportCsv"
        class="btn-secondary btn-sm shrink-0"
        title="Export ke CSV"
      >
        <Download class="w-4 h-4 text-slate-500" />
        <span>CSV</span>
      </button>
    </div>

    <!-- Search + Filter -->
    <div class="space-y-3">
      <div class="relative">
        <Search class="w-[18px] h-[18px] text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          v-model="searchQuery"
          type="search"
          enterkeyhint="search"
          placeholder="Cari perusahaan, posisi, atau email..."
          class="form-input pl-11"
        />
      </div>

      <!-- Status chips (scroll horizontal di mobile) -->
      <div class="flex gap-2 overflow-x-auto hide-scrollbar bleed-x lg:flex-wrap" role="tablist" aria-label="Filter status">
        <button
          v-for="st in ['ALL', ...statusOptions]"
          :key="st"
          @click="selectedStatus = st"
          role="tab"
          :aria-selected="selectedStatus === st"
          class="chip"
          :class="selectedStatus === st ? 'chip-active' : 'chip-idle'"
        >
          <span v-if="st !== 'ALL'" class="w-2 h-2 rounded-full" :class="getStatusDotClass(st)"></span>
          <span>{{ st === 'ALL' ? 'Semua' : st }}</span>
          <span class="text-[11px] font-bold opacity-60">{{ statusCounts[st] }}</span>
        </button>
      </div>
    </div>

    <template v-if="filteredApplications.length > 0">
      <!-- Desktop Table View (lg) -->
      <div class="hidden xl:block clean-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-[13px] text-slate-700">
            <thead class="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-wider border-b border-slate-200">
              <tr>
                <th class="px-5 py-3.5 font-semibold min-w-[220px]">Perusahaan & Posisi</th>
                <th class="px-4 py-3.5 font-semibold">Kontak Rekruter</th>
                <th class="px-4 py-3.5 font-semibold">Status</th>
                <th class="px-4 py-3.5 font-semibold min-w-[180px]">Catatan</th>
                <th class="px-5 py-3.5 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="app in filteredApplications"
                :key="app.id"
                class="hover:bg-slate-50/70 transition-colors align-top"
              >
                <td class="px-5 py-4">
                  <div class="font-bold text-slate-900 text-sm">{{ app.companyName }}</div>
                  <div class="text-indigo-700 font-medium mt-0.5">{{ app.positionTitle }}</div>
                  <div class="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1.5">
                    <Calendar class="w-3.5 h-3.5" />
                    <span>{{ formatDate(app.appliedAt) }}</span>
                    <span v-if="app.channelUsed" class="capitalize">• via {{ app.channelUsed }}</span>
                  </div>
                </td>

                <td class="px-4 py-4 space-y-1">
                  <div v-if="app.contactEmail" class="flex items-center gap-1.5 text-slate-600">
                    <Mail class="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span class="truncate max-w-[200px]">{{ app.contactEmail }}</span>
                  </div>
                  <div v-if="app.contactPhone" class="flex items-center gap-1.5 text-slate-600">
                    <Phone class="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{{ app.contactPhone }}</span>
                  </div>
                  <span v-if="!app.contactEmail && !app.contactPhone" class="text-slate-400">—</span>
                </td>


                <td class="px-4 py-4">
                  <select
                    :value="app.status"
                    @change="appStore.updateApplicationStatus(app.id, $event.target.value)"
                    class="h-9 pl-2.5 pr-7 rounded-lg text-xs font-semibold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    :class="getStatusBadgeClass(app.status)"
                    aria-label="Ubah status"
                  >
                    <option v-for="st in statusOptions" :key="st" :value="st">{{ st }}</option>
                  </select>
                </td>

                <td class="px-4 py-4">
                  <input
                    v-model="app.notes"
                    @blur="appStore.updateApplicationNotes(app.id, app.notes)"
                    placeholder="Catatan..."
                    class="w-full h-9 bg-slate-50 px-2.5 rounded-lg text-[13px] text-slate-800 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                </td>

                <td class="px-5 py-3">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      v-if="app.contactEmail"
                      @click="openGmail(app)"
                      class="btn-icon w-10 h-10 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      title="Buka kembali di Gmail"
                      aria-label="Buka di Gmail"
                    >
                      <Mail class="w-4 h-4" />
                    </button>
                    <button
                      v-if="app.contactPhone"
                      @click="openWhatsApp(app)"
                      class="btn-icon w-10 h-10 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                      title="Buka kembali di WhatsApp"
                      aria-label="Buka di WhatsApp"
                    >
                      <MessageSquare class="w-4 h-4" />
                    </button>
                    <button
                      @click="handleDelete(app.id)"
                      class="btn-icon-danger w-10 h-10"
                      title="Hapus riwayat"
                      aria-label="Hapus riwayat"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mobile / Tablet Card List -->
      <ul class="xl:hidden grid grid-cols-1 md:grid-cols-2 gap-3">
        <li
          v-for="app in filteredApplications"
          :key="app.id"
          class="clean-card p-4 flex flex-col gap-3"
        >
          <!-- Top: perusahaan, posisi, status -->
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="font-bold text-slate-900 text-[15px] leading-snug break-words">{{ app.companyName }}</h3>
              <p class="text-indigo-700 font-semibold text-[13px] mt-0.5 break-words">{{ app.positionTitle }}</p>
            </div>
            <select
              :value="app.status"
              @change="appStore.updateApplicationStatus(app.id, $event.target.value)"
              class="shrink-0 h-9 pl-3 pr-7 rounded-full text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              :class="getStatusBadgeClass(app.status)"
              aria-label="Ubah status"
            >
              <option v-for="st in statusOptions" :key="st" :value="st">{{ st }}</option>
            </select>
          </div>

          <!-- Meta -->
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span class="inline-flex items-center gap-1">
              <Calendar class="w-3.5 h-3.5 text-slate-400" />
              {{ formatDate(app.appliedAt) }}
            </span>
            <span v-if="app.channelUsed" class="capitalize">• via {{ app.channelUsed }}</span>
          </div>

          <div v-if="app.contactEmail || app.contactPhone" class="space-y-1 text-[13px] text-slate-600">
            <div v-if="app.contactEmail" class="flex items-center gap-2 min-w-0">
              <Mail class="w-4 h-4 text-rose-500 shrink-0" />
              <span class="truncate">{{ app.contactEmail }}</span>
            </div>
            <div v-if="app.contactPhone" class="flex items-center gap-2">
              <Phone class="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{{ app.contactPhone }}</span>
            </div>
          </div>

          <!-- Catatan -->
          <input
            v-model="app.notes"
            @blur="appStore.updateApplicationNotes(app.id, app.notes)"
            placeholder="Tambah catatan..."
            class="form-input bg-slate-50 focus:bg-white"
            aria-label="Catatan lamaran"
          />

          <!-- Aksi -->
          <div class="flex items-center gap-2 pt-3 mt-auto border-t border-slate-100">
            <button
              v-if="app.contactEmail"
              @click="openGmail(app)"
              class="btn btn-sm flex-1 bg-rose-50 text-rose-700 hover:bg-rose-100 active:bg-rose-200"
            >
              <Mail class="w-4 h-4" />
              <span>Gmail</span>
            </button>
            <button
              v-if="app.contactPhone"
              @click="openWhatsApp(app)"
              class="btn btn-sm flex-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:bg-emerald-200"
            >
              <MessageSquare class="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
            <div v-if="!app.contactEmail && !app.contactPhone" class="flex-1 text-xs text-slate-400">Tidak ada kontak</div>
            <button
              @click="handleDelete(app.id)"
              class="btn-icon-danger"
              title="Hapus"
              aria-label="Hapus riwayat"
            >
              <Trash2 class="w-[18px] h-[18px]" />
            </button>
          </div>
        </li>
      </ul>
    </template>

    <!-- Tidak ada hasil filter -->
    <div v-else-if="isFiltering && appStore.applications.length > 0" class="text-center py-12 px-4 clean-card">
      <Search class="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <h3 class="text-base font-bold text-slate-800">Tidak ada hasil</h3>
      <p class="text-sm text-slate-500 max-w-sm mx-auto mt-1">Coba kata kunci lain atau ubah filter status.</p>
      <button @click="resetFilters" class="btn-secondary mt-4">Reset Filter</button>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12 sm:py-16 px-5 clean-card">
      <div class="w-14 h-14 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center mb-3">
        <Briefcase class="w-7 h-7 text-slate-400" />
      </div>
      <h3 class="text-base font-bold text-slate-800">Belum ada riwayat lamaran</h3>
      <p class="text-sm text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
        Saat Anda memproses screenshot lowongan dan mengklik kirim atau simpan, lamaran otomatis tercatat di sini.
      </p>
      <router-link to="/" class="btn-primary mt-5 w-full xs:w-auto">
        <Send class="w-4 h-4" />
        <span>Mulai Scan Sekarang</span>
      </router-link>
    </div>
  </div>
</template>
