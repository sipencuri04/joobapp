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
  CheckCircle2
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
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
          Job Application Tracker
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          Pantau seluruh status lamaran, rekruter yang telah dihubungi, dan catatan tindak lanjut.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="exportCsv"
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors shadow-xs"
        >
          <Download class="w-3.5 h-3.5 text-slate-500" />
          <span>Export CSV</span>
        </button>
      </div>
    </div>

    <!-- Filter & Search Bar -->
    <div class="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
      <!-- Search Input -->
      <div class="relative flex-1 w-full">
        <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari perusahaan, posisi, atau email..."
          class="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      <!-- Status Filter Dropdown -->
      <div class="relative w-full sm:w-auto">
        <select
          v-model="selectedStatus"
          class="w-full sm:w-48 appearance-none px-4 py-2 pr-9 rounded-lg text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer transition-colors hover:border-indigo-300"
        >
          <option value="ALL">🗂️ Semua ({{ appStore.applications.length }})</option>
          <option v-for="st in statusOptions" :key="st" :value="st">{{ st }}</option>
        </select>
        <div class="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Desktop Table View (md:block) -->
    <div v-if="filteredApplications.length > 0" class="hidden md:block clean-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-700">
          <thead class="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th class="px-5 py-3.5 font-semibold">Perusahaan & Posisi</th>
              <th class="px-4 py-3.5 font-semibold">Kontak Rekruter</th>
              <th class="px-4 py-3.5 font-semibold">Tanggal</th>
              <th class="px-4 py-3.5 font-semibold">Status</th>
              <th class="px-4 py-3.5 font-semibold">Catatan</th>
              <th class="px-5 py-3.5 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="app in filteredApplications"
              :key="app.id"
              class="hover:bg-slate-50/70 transition-colors"
            >
              <!-- Company & Role -->
              <td class="px-5 py-4">
                <div class="font-bold text-slate-900 text-sm">{{ app.companyName }}</div>
                <div class="text-indigo-700 font-medium text-xs mt-0.5">{{ app.positionTitle }}</div>
                <div v-if="app.channelUsed" class="text-[10px] text-slate-400 mt-1 capitalize">
                  via {{ app.channelUsed }}
                </div>
              </td>

              <!-- Contacts -->
              <td class="px-4 py-4 space-y-1">
                <div v-if="app.contactEmail" class="flex items-center gap-1.5 text-slate-600">
                  <Mail class="w-3.5 h-3.5 text-rose-500" />
                  <span class="truncate max-w-[180px]">{{ app.contactEmail }}</span>
                </div>
                <div v-if="app.contactPhone" class="flex items-center gap-1.5 text-slate-600">
                  <Phone class="w-3.5 h-3.5 text-emerald-600" />
                  <span>{{ app.contactPhone }}</span>
                </div>
              </td>

              <!-- Date -->
              <td class="px-4 py-4 whitespace-nowrap text-slate-500">
                <div class="flex items-center gap-1.5">
                  <Calendar class="w-3.5 h-3.5 text-slate-400" />
                  <span>{{ formatDate(app.appliedAt) }}</span>
                </div>
              </td>

              <!-- Status Dropdown -->
              <td class="px-4 py-4">
                <select
                  :value="app.status"
                  @change="appStore.updateApplicationStatus(app.id, $event.target.value)"
                  class="px-2.5 py-1 rounded-md text-xs font-semibold border cursor-pointer focus:outline-none"
                  :class="getStatusBadgeClass(app.status)"
                >
                  <option v-for="st in statusOptions" :key="st" :value="st">{{ st }}</option>
                </select>
              </td>

              <!-- Notes Input -->
              <td class="px-4 py-4">
                <input
                  v-model="app.notes"
                  @blur="appStore.updateApplicationNotes(app.id, app.notes)"
                  placeholder="Catatan..."
                  class="w-full bg-slate-50 px-2.5 py-1 rounded-md text-xs text-slate-800 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
              </td>

              <!-- Action Buttons -->
              <td class="px-5 py-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    v-if="app.contactEmail"
                    @click="openGmail(app)"
                    class="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                    title="Buka kembali di Gmail"
                  >
                    <Mail class="w-4 h-4" />
                  </button>

                  <button
                    v-if="app.contactPhone"
                    @click="openWhatsApp(app)"
                    class="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
                    title="Buka kembali di WhatsApp"
                  >
                    <MessageSquare class="w-4 h-4" />
                  </button>

                  <button
                    @click="handleDelete(app.id)"
                    class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Hapus riwayat"
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

    <!-- Mobile Card View (md:hidden) -->
    <div v-if="filteredApplications.length > 0" class="block md:hidden space-y-3">
      <div 
        v-for="app in filteredApplications" 
        :key="app.id"
        class="clean-card p-4 space-y-3 border border-slate-200 hover:border-slate-300 transition-all shadow-xs"
      >
        <!-- Card Top: Company, Position & Status -->
        <div class="flex items-start justify-between gap-2">
          <div>
            <h4 class="font-bold text-slate-900 text-sm leading-snug">{{ app.companyName }}</h4>
            <p class="text-indigo-700 font-semibold text-xs mt-0.5">{{ app.positionTitle }}</p>
            <span v-if="app.channelUsed" class="inline-block text-[10px] text-slate-400 capitalize mt-0.5">
              via {{ app.channelUsed }}
            </span>
          </div>
          <!-- Status Dropdown Mobile -->
          <select
            :value="app.status"
            @change="appStore.updateApplicationStatus(app.id, $event.target.value)"
            class="px-2.5 py-1 rounded-md text-[11px] font-semibold border cursor-pointer focus:outline-none flex-shrink-0"
            :class="getStatusBadgeClass(app.status)"
          >
            <option v-for="st in statusOptions" :key="st" :value="st">{{ st }}</option>
          </select>
        </div>

        <!-- Date & Contacts Details -->
        <div class="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
          <div class="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Calendar class="w-3.5 h-3.5 text-slate-400" />
            <span>Dilamar pada: {{ formatDate(app.appliedAt) }}</span>
          </div>

          <div v-if="app.contactEmail" class="flex items-center gap-1.5 text-slate-600">
            <Mail class="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
            <span class="truncate">{{ app.contactEmail }}</span>
          </div>

          <div v-if="app.contactPhone" class="flex items-center gap-1.5 text-slate-600">
            <Phone class="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span>{{ app.contactPhone }}</span>
          </div>
        </div>

        <!-- Notes Input Mobile -->
        <div class="pt-1">
          <input
            v-model="app.notes"
            @blur="appStore.updateApplicationNotes(app.id, app.notes)"
            placeholder="Tambah catatan lamaran..."
            class="w-full bg-slate-50 px-3 py-1.5 rounded-lg text-xs text-slate-800 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <!-- Actions Footer Mobile -->
        <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <div class="flex items-center gap-2">
            <button
              v-if="app.contactEmail"
              @click="openGmail(app)"
              class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium text-xs transition-colors"
            >
              <Mail class="w-3.5 h-3.5" />
              <span>Gmail</span>
            </button>

            <button
              v-if="app.contactPhone"
              @click="openWhatsApp(app)"
              class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-xs transition-colors"
            >
              <MessageSquare class="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>

          <button
            @click="handleDelete(app.id)"
            class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Hapus"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-16 px-4 clean-card">
      <Briefcase class="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <h3 class="text-base font-bold text-slate-800">Belum ada riwayat lamaran pekerjaan</h3>
      <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1">
        Saat Anda memproses screenshot lowongan dan mengklik tombol kirim atau simpan, daftar lamaran akan otomatis tercatat di sini.
      </p>
      <router-link
        to="/"
        class="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs"
      >
        <span>Mulai Scan Sekarang</span>
      </router-link>
    </div>
  </div>
</template>
