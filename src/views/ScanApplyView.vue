<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProfileStore } from '../stores/profile'
import { useApplicationStore } from '../stores/applications'
import { useSettingsStore } from '../stores/settings'
import { executeJobScan, executeTailorDocuments } from '../services/aiManager'
import { getMockJobData, cleanIndonesianPhoneNumber } from '../services/gemini'

import CoverLetterPreview from '../components/CoverLetterPreview.vue'
import CvPreview from '../components/CvPreview.vue'
import PortfolioSelector from '../components/PortfolioSelector.vue'

import { 
  Upload, 
  Sparkles, 
  Mail, 
  Phone, 
  Building, 
  Briefcase, 
  MapPin, 
  ExternalLink, 
  Send, 
  Bookmark, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  MessageSquare, 
  Layers, 
  FileText,
  Copy,
  ChevronRight,
  ClipboardPaste,
  Image as ImageIcon,
  Database
} from 'lucide-vue-next'

const router = useRouter()
const profileStore = useProfileStore()
const appStore = useApplicationStore()
const settingsStore = useSettingsStore()

const activeTab = ref('cover_letter') // 'cover_letter' | 'cv' | 'portfolio' | 'wa'
const fileInput = ref(null)
const isDragging = ref(false)
const showSuccessNotification = ref(false)
const successMessage = ref('')
const copiedWa = ref(false)

const current = computed(() => appStore.currentJob)

const activeAiBadge = computed(() => {
  if (settingsStore.effectiveAiProvider === 'groq') {
    return {
      text: 'Groq LPU Aktif (Llama 3.2 Vision)',
      class: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
  }
  if (settingsStore.effectiveAiProvider === 'gemini') {
    return {
      text: 'Gemini AI Aktif (Gemini 3.8 Flash)',
      class: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    }
  }
  return {
    text: 'Mode Demo (Set API Key di Pengaturan)',
    class: 'bg-amber-50 text-amber-700 border-amber-200'
  }
})

// WhatsApp Web link generator
const whatsappLink = computed(() => {
  if (!current.value.phone) return '#'
  const cleanPhone = cleanIndonesianPhoneNumber(current.value.phone)
  const encodedText = encodeURIComponent(current.value.tailoredWhatsAppMessage || '')
  return `https://wa.me/${cleanPhone}?text=${encodedText}`
})

// Direct Gmail Web Compose link generator
const gmailComposeLink = computed(() => {
  const to = encodeURIComponent(current.value.email || '')
  const su = encodeURIComponent(current.value.tailoredEmailSubject || `Lamaran Pekerjaan - ${current.value.jobTitle}`)
  const body = encodeURIComponent(current.value.tailoredCoverLetter || '')
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${body}`
})

// Listen to paste anywhere on page (Ctrl+V screenshot directly)
onMounted(() => {
  window.addEventListener('paste', handleGlobalPaste)
})

function handleGlobalPaste(e) {
  const items = e.clipboardData?.items
  if (!items) return

  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      const file = items[i].getAsFile()
      if (file) {
        processImageFile(file)
        break
      }
    }
  }
}

function handleFileInput(e) {
  const file = e.target.files?.[0]
  if (file) processImageFile(file)
}

function handleDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    processImageFile(file)
  }
}

async function processImageFile(file) {
  const reader = new FileReader()
  reader.onload = async (e) => {
    const dataUrl = e.target.result
    appStore.setScreenshot(dataUrl)

    try {
      appStore.setScanning(true)
      let detectedData

      if (settingsStore.hasAnyAiKey) {
        // Use real Multimodal Vision AI via Unified Router (Groq Llama 3.2 Vision or Gemini 3.8 Flash)
        detectedData = await executeJobScan(dataUrl)
      } else {
        // Mock fallback with warning
        alert('API Key (Groq atau Gemini) belum diatur. Menggunakan data simulasi demo. Masukkan API Key di menu Pengaturan untuk analisis AI nyata!')
        detectedData = getMockJobData()
      }

      appStore.setDetectedJob(detectedData)
      await triggerAutoTailor()
    } catch (err) {
      console.error('Scan error:', err)
      alert('Gagal menganalisis gambar: ' + (err.message || 'Cek koneksi & API Key.'))
    } finally {
      appStore.setScanning(false)
    }
  }
  reader.readAsDataURL(file)
}

// Tailor documents with AI
async function triggerAutoTailor() {
  appStore.setTailoring(true)
  try {
    const jobInfo = {
      companyName: current.value.companyName,
      jobTitle: current.value.jobTitle,
      requirements: current.value.requirements || [],
      contactEmail: current.value.email,
      contactPhone: current.value.phone
    }

    const applicantProfile = {
      profile: profileStore.profile,
      experiences: profileStore.experiences,
      educations: profileStore.educations,
      skills: profileStore.skills,
      portfolios: profileStore.portfolios
    }

    let tailoredResult
    if (settingsStore.hasAnyAiKey) {
      tailoredResult = await executeTailorDocuments(
        jobInfo,
        applicantProfile,
        profileStore.masterCoverLetter
      )
    } else {
      // Offline fallback template interpolation
      const cl = profileStore.masterCoverLetter
        .replace(/{{company}}/g, current.value.companyName || 'Perusahaan')
        .replace(/{{position}}/g, current.value.jobTitle || 'Posisi')
        .replace(/{{name}}/g, profileStore.profile.fullName)
        .replace(/{{phone}}/g, profileStore.profile.phone)
        .replace(/{{email}}/g, profileStore.profile.email)
        .replace(/{{date}}/g, new Date().toLocaleDateString('id-ID'))

      tailoredResult = {
        coverLetter: cl,
        emailSubject: `Lamaran Pekerjaan: ${current.value.jobTitle} - ${profileStore.profile.fullName}`,
        professionalSummary: profileStore.profile.bio,
        whatsAppMessage: `Halo HRD / Tim Rekrutmen ${current.value.companyName},\n\nPerkenalkan saya ${profileStore.profile.fullName}. Saya tertarik untuk melamar posisi ${current.value.jobTitle} sesuai informasi lowongan yang saya lihat.\n\nSaya telah melampirkan Curriculum Vitae (CV) dan tautan portofolio proyek saya. Terima kasih banyak atas kesempatannya.`,
        recommendedPortfolioIds: profileStore.portfolios.slice(0, 3).map(p => p.id)
      }
    }

    appStore.updateTailoredData(tailoredResult)
  } catch (err) {
    console.error('Tailor error:', err)
  } finally {
    appStore.setTailoring(false)
  }
}

// Direct Actions: Gmail
function handleOpenGmail() {
  if (!current.value.email) {
    alert('Email rekruter belum terdeteksi. Silakan ketik email pada kolom di bawah.')
    return
  }
  handleSaveToTracker('applied')
  window.open(gmailComposeLink.value, '_blank')
}

// Direct Actions: WhatsApp
function handleOpenWhatsApp() {
  if (!current.value.phone) {
    alert('Nomor HP/WA belum terdeteksi. Silakan ketik nomor pada kolom di bawah.')
    return
  }
  handleSaveToTracker('applied')
  window.open(whatsappLink.value, '_blank')
}

function copyWhatsAppMessage() {
  navigator.clipboard.writeText(current.value.tailoredWhatsAppMessage || '')
  copiedWa.value = true
  setTimeout(() => {
    copiedWa.value = false
  }, 2000)
}

function handleSaveToTracker(initialStatus = 'applied') {
  appStore.saveCurrentToTracker(initialStatus)
  successMessage.value = `Lamaran ke ${current.value.companyName || 'Perusahaan'} berhasil disimpan ke Job Tracker!`
  showSuccessNotification.value = true
  setTimeout(() => {
    showSuccessNotification.value = false
  }, 3500)
}

function loadDemoSample() {
  const mock = getMockJobData()
  appStore.setDetectedJob(mock)
  triggerAutoTailor()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Success Toast Notification -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform -translate-y-4 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform -translate-y-4 opacity-0"
    >
      <div 
        v-if="showSuccessNotification" 
        class="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center space-x-2 text-xs font-semibold"
      >
        <Check class="w-4 h-4" />
        <span>{{ successMessage }}</span>
      </div>
    </transition>

    <!-- Top Hero Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
          Scan & Apply Lowongan Kerja
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          Upload screenshot lowongan kerja. AI otomatis membaca kontak rekruter (Email & WA) dan menyiapkan dokumen lamaran.
        </p>
      </div>

      <div class="flex items-center space-x-2">
        <span 
          class="px-2.5 py-1 rounded-full text-xs font-medium border transition-colors"
          :class="activeAiBadge.class"
        >
          {{ activeAiBadge.text }}
        </span>

        <span 
          class="px-2.5 py-1 rounded-full text-xs font-medium border"
          :class="settingsStore.hasSupabase 
            ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
            : 'bg-slate-100 text-slate-600 border-slate-200'"
        >
          {{ settingsStore.hasSupabase ? `${profileStore.portfolios.length} Porto Supabase` : 'Penyimpanan Lokal' }}
        </span>
      </div>
    </div>

    <!-- Upload Dropzone Card -->
    <div class="clean-card p-6 sm:p-8">
      <div
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        @click="fileInput?.click()"
        class="group relative border-2 border-dashed rounded-xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-150"
        :class="isDragging 
          ? 'border-indigo-500 bg-indigo-50/50 ring-4 ring-indigo-100' 
          : 'border-slate-300 bg-slate-50/50 hover:border-indigo-400 hover:bg-white'"
      >
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleFileInput"
        />

        <div class="flex flex-col items-center justify-center space-y-3">
          <div class="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform shadow-xs">
            <Upload class="w-6 h-6" />
          </div>

          <div>
            <p class="text-sm font-semibold text-slate-800">
              Tarik & Letakkan screenshot lowongan di sini, atau <span class="text-indigo-600 underline font-bold">Pilih File</span>
            </p>
            <p class="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1.5">
              <ClipboardPaste class="w-3.5 h-3.5 text-indigo-600" />
              <span>Bisa langsung tekan <kbd class="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-mono text-[10px] shadow-xs">Ctrl + V</kbd> untuk paste gambar dari clipboard!</span>
            </p>
          </div>

          <div class="pt-2">
            <button
              type="button"
              @click.stop="loadDemoSample"
              class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Sparkles class="w-3.5 h-3.5 text-amber-500" />
              <span>Coba Contoh Lowongan (Demo)</span>
            </button>
          </div>
        </div>

        <!-- Scanning Loading Overlay -->
        <div
          v-if="appStore.isScanning || appStore.isTailoring"
          class="absolute inset-0 bg-white/90 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center space-y-3 z-20"
        >
          <div class="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm font-bold text-slate-800">
            {{ appStore.isScanning ? 'AI Sedang membaca screenshot lowongan & kontak...' : 'Menyesuaikan Surat Lamaran & CV Anda...' }}
          </p>
          <p class="text-xs text-slate-500">Mendeteksi otomatis Gmail, No. HP, posisi, dan persyaratan...</p>
        </div>
      </div>
    </div>

    <!-- Active Workspace Section (Split Screen) -->
    <div v-if="current.companyName || current.screenshotDataUrl" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      <!-- Left Column: Detected Job Details & Direct Action Buttons (lg:col-span-5) -->
      <div class="lg:col-span-5 space-y-5">
        
        <!-- Detected Info Card -->
        <div class="clean-card p-6 space-y-5">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div class="flex items-center space-x-2">
              <Building class="w-4 h-4 text-indigo-600" />
              <h2 class="font-bold text-sm text-slate-900">Informasi Lowongan</h2>
            </div>
            <button
              @click="triggerAutoTailor()"
              :disabled="appStore.isTailoring"
              class="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 disabled:opacity-50"
              title="Sesuaikan ulang dengan AI"
            >
              <RefreshCw class="w-3 h-3" :class="{'animate-spin': appStore.isTailoring}" />
              <span>Tailor Ulang</span>
            </button>
          </div>

          <!-- Screenshot Preview Thumbnail if exists -->
          <div v-if="current.screenshotDataUrl" class="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-h-48 group">
            <img :src="current.screenshotDataUrl" alt="Job Screenshot" class="w-full h-full object-contain" />
            <div class="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-white/90 text-[10px] font-medium text-slate-700 shadow-xs border border-slate-200">
              Screenshot Terbaca
            </div>
          </div>

          <!-- Editable Fields Form -->
          <div class="space-y-3.5">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Perusahaan / Instansi</label>
              <input
                v-model="current.companyName"
                type="text"
                class="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Nama Perusahaan"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Posisi yang Dilamar</label>
              <input
                v-model="current.jobTitle"
                type="text"
                class="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Frontend Developer / Marketing / etc."
              />
            </div>

            <!-- Auto-detected Contacts Highlight Box -->
            <div class="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-3">
              <div class="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles class="w-3.5 h-3.5 text-indigo-600" />
                <span>Auto-Detected Kontak Rekruter</span>
              </div>

              <!-- Email Field with Gmail indicator -->
              <div>
                <label class="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span class="flex items-center gap-1 font-medium"><Mail class="w-3.5 h-3.5 text-rose-500" /> Email Rekrutmen</span>
                  <span v-if="current.email?.toLowerCase().includes('gmail.com')" class="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                    Gmail
                  </span>
                </label>
                <input
                  v-model="current.email"
                  type="email"
                  class="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="rekrutmen@gmail.com"
                />
              </div>

              <!-- Phone / WhatsApp Field with WhatsApp indicator -->
              <div>
                <label class="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span class="flex items-center gap-1 font-medium"><Phone class="w-3.5 h-3.5 text-emerald-600" /> No. WhatsApp / HP</span>
                  <span v-if="current.phone" class="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    WhatsApp Ready
                  </span>
                </label>
                <input
                  v-model="current.phone"
                  type="text"
                  class="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="08123456789 atau 62812..."
                />
              </div>
            </div>

            <!-- Requirements Chips -->
            <div v-if="current.requirements?.length > 0">
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">Persyaratan Lowongan Terdeteksi:</label>
              <ul class="space-y-1 text-xs text-slate-600">
                <li v-for="(req, i) in current.requirements.slice(0, 4)" :key="i" class="flex items-start gap-1.5">
                  <span class="text-indigo-600 font-bold">•</span>
                  <span>{{ req }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- DIRECT ACTION BUTTONS -->
          <div class="pt-4 border-t border-slate-100 space-y-2.5">
            <div class="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Aksi Langsung Pengiriman:
            </div>

            <!-- Buka Gmail Button -->
            <button
              @click="handleOpenGmail"
              :disabled="!current.email"
              class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Mail class="w-4 h-4" />
              <span>Kirim via Gmail Web</span>
              <ExternalLink class="w-3.5 h-3.5 opacity-80" />
            </button>

            <!-- Kirim WhatsApp Button -->
            <button
              @click="handleOpenWhatsApp"
              :disabled="!current.phone"
              class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <MessageSquare class="w-4 h-4" />
              <span>Kirim via WhatsApp Web</span>
              <ExternalLink class="w-3.5 h-3.5 opacity-80" />
            </button>

            <!-- Simpan ke Job Tracker -->
            <button
              @click="handleSaveToTracker('manual')"
              class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-xs bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors shadow-xs"
            >
              <Bookmark class="w-3.5 h-3.5 text-indigo-600" />
              <span>Simpan ke Riwayat Tracker</span>
            </button>
          </div>
        </div>

      </div>

      <!-- Right Column: Document Workspace (lg:col-span-7) -->
      <div class="lg:col-span-7 space-y-4">
        
        <!-- Navigation Tabs -->
        <div class="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto hide-scrollbar">
          <button
            @click="activeTab = 'cover_letter'"
            class="flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
            :class="activeTab === 'cover_letter' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
          >
            <FileText class="w-4 h-4" />
            <span>Surat Lamaran</span>
          </button>

          <button
            @click="activeTab = 'cv'"
            class="flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
            :class="activeTab === 'cv' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
          >
            <Briefcase class="w-4 h-4" />
            <span>CV Standar ATS</span>
          </button>

          <button
            @click="activeTab = 'portfolio'"
            class="flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
            :class="activeTab === 'portfolio' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
          >
            <Layers class="w-4 h-4" />
            <span>Porto Pilihan</span>
          </button>

          <button
            @click="activeTab = 'wa'"
            class="flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
            :class="activeTab === 'wa' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
          >
            <MessageSquare class="w-4 h-4" />
            <span>Pesan WA</span>
          </button>
        </div>

        <!-- Tab 1: Surat Lamaran Preview & Editor -->
        <div v-show="activeTab === 'cover_letter'" class="h-[80vh] min-h-[750px]">
          <CoverLetterPreview
            :content="current.tailoredCoverLetter"
            @update:content="current.tailoredCoverLetter = $event"
            :companyName="current.companyName"
            :positionTitle="current.jobTitle"
            :applicantName="profileStore.profile.fullName"
          />
        </div>

        <!-- Tab 2: CV Preview & Customizer -->
        <div v-show="activeTab === 'cv'" class="h-[80vh] min-h-[750px]">
          <CvPreview
            :profile="profileStore.profile"
            :experiences="profileStore.experiences"
            :educations="profileStore.educations"
            :skills="profileStore.skills"
            :portfolios="profileStore.portfolios"
            :selectedPortfolioIds="current.selectedPortfolioIds"
            :tailoredSummary="current.tailoredProfessionalSummary"
            :targetPosition="current.jobTitle"
          />
        </div>

        <!-- Tab 3: Portofolio Selector -->
        <div v-show="activeTab === 'portfolio'" class="h-[80vh] min-h-[750px]">
          <PortfolioSelector
            :portfolios="profileStore.portfolios"
            :selectedIds="current.selectedPortfolioIds"
            @toggle="appStore.togglePortfolioSelection"
          />
        </div>

        <!-- Tab 4: WhatsApp Message Preview -->
        <div v-show="activeTab === 'wa'" class="clean-card p-6 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
            <div class="flex items-center space-x-2">
              <MessageSquare class="w-4 h-4 text-emerald-600" />
              <h3 class="font-bold text-sm text-slate-900">Draft Pesan Pengantar WhatsApp</h3>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="activeTab = 'cv'"
                class="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors shadow-xs"
              >
                <FileText class="w-3.5 h-3.5 text-indigo-600" />
                <span>Lihat & Unduh PDF CV</span>
              </button>

              <button
                @click="copyWhatsAppMessage"
                class="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors shadow-xs"
              >
                <component :is="copiedWa ? Check : Copy" class="w-3.5 h-3.5" :class="copiedWa ? 'text-emerald-600' : 'text-slate-500'" />
                <span>{{ copiedWa ? 'Tersalin!' : 'Salin Pesan' }}</span>
              </button>
            </div>
          </div>

          <!-- Panduan Alur Kirim Berkas via WA -->
          <div class="p-3.5 bg-emerald-50/60 border border-emerald-200/90 rounded-xl text-xs space-y-1.5">
            <div class="font-bold text-emerald-900 flex items-center gap-1.5">
              <Check class="w-3.5 h-3.5 text-emerald-600" />
              <span>Cara Mengirimkan CV & Portofolio via WhatsApp:</span>
            </div>
            <ol class="list-decimal list-inside text-emerald-800 space-y-1 text-[11px] leading-relaxed">
              <li><strong>Unduh PDF CV:</strong> Klik tombol <em>"Lihat & Unduh PDF CV"</em> di atas atau di tab sebelah untuk menyimpan file PDF CV ATS Anda.</li>
              <li><strong>Buka WhatsApp:</strong> Klik <em>"Buka WhatsApp Sekarang"</em> di bawah. Teks perkenalan dan ringkasan portofolio sudah terisi otomatis di chat.</li>
              <li><strong>Lampirkan Berkas:</strong> Seret (drag & drop) file PDF CV yang diunduh ke jendela chat WhatsApp (atau klik 📎 Lampirkan Dokumen), lalu tekan Kirim!</li>
            </ol>
          </div>

          <p class="text-xs text-slate-500">
            Pesan ini otomatis disiapkan saat Anda mengklik tombol "Buka WhatsApp Sekarang". Anda dapat menyesuaikan teksnya di bawah:
          </p>

          <textarea
            v-model="current.tailoredWhatsAppMessage"
            rows="10"
            class="w-full p-4 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm font-sans leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            placeholder="Tulis pesan WhatsApp..."
          ></textarea>

          <div class="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div class="text-[11px] text-slate-500 flex items-center gap-1">
              <Phone class="w-3.5 h-3.5 text-emerald-600" />
              <span>Tujuan: <strong>{{ current.phone || 'Belum terdeteksi' }}</strong></span>
            </div>

            <div class="flex items-center gap-2">
              <button
                @click="activeTab = 'cv'"
                class="flex items-center gap-1.5 py-2 px-3.5 rounded-xl font-semibold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                <FileText class="w-3.5 h-3.5" />
                <span>Unduh PDF CV Dahulu</span>
              </button>

              <button
                @click="handleOpenWhatsApp"
                :disabled="!current.phone"
                class="flex items-center gap-2 py-2 px-4 rounded-xl font-semibold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs disabled:opacity-40"
              >
                <Send class="w-3.5 h-3.5" />
                <span>Buka WhatsApp Sekarang</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>

    <!-- Empty State Prompt if no job scanned yet -->
    <div v-else class="text-center py-16 px-4 clean-card">
      <div class="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 mx-auto flex items-center justify-center mb-3 text-indigo-600">
        <Briefcase class="w-7 h-7" />
      </div>
      <h3 class="text-base font-bold text-slate-900">Belum ada screenshot yang diunggah</h3>
      <p class="text-xs text-slate-500 max-w-md mx-auto mt-1">
        Silakan unggah gambar screenshot lowongan kerja di atas atau klik tombol <strong>"Coba Contoh Lowongan (Demo)"</strong> untuk melihat proses otomatisasi.
      </p>
    </div>
  </div>
</template>
