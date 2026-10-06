<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProfileStore } from '../stores/profile'
import { useApplicationStore } from '../stores/applications'
import { useSettingsStore } from '../stores/settings'
import { executeJobScan, executeTailorDocuments } from '../services/aiManager'
import { getMockJobData, cleanIndonesianPhoneNumber } from '../services/gemini'
import { 
  generateTailoredParagraph1, 
  generateTailoredParagraph2, 
  formatFullCoverLetterText, 
  formatIndonesianDate,
  generateNaturalWhatsAppMessage,
  sortPositionsByRelevance,
  isPositionItRelated,
  getBestPositionForItGraduate,
  cleanLocationCity,
  formatDegreeMajor
} from '../services/coverLetterGenerator'

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
const hasJob = computed(() => Boolean(current.value.companyName || current.value.screenshotDataUrl))
const isBusy = computed(() => appStore.isScanning || appStore.isTailoring)

const docTabs = [
  { key: 'cover_letter', label: 'Surat Lamaran', short: 'Surat', icon: FileText },
  { key: 'cv', label: 'CV Standar ATS', short: 'CV', icon: Briefcase },
  { key: 'portfolio', label: 'Porto Pilihan', short: 'Porto', icon: Layers },
  { key: 'wa', label: 'Pesan WA', short: 'Pesan WA', icon: MessageSquare }
]

const activeAiBadge = computed(() => {
  if (settingsStore.effectiveAiProvider === 'groq') {
    return {
      text: 'Groq LPU Aktif',
      class: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
  }
  if (settingsStore.effectiveAiProvider === 'gemini') {
    return {
      text: 'Gemini AI Aktif',
      class: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    }
  }
  return {
    text: 'Mode Demo — Set API Key',
    class: 'bg-amber-50 text-amber-700 border-amber-200'
  }
})

// Urutkan posisi terdeteksi berdasarkan relevansi dengan lulusan IT
const sortedAvailablePositions = computed(() => {
  return sortPositionsByRelevance(current.value.availablePositions || [])
})

async function selectAvailablePosition(pos) {
  if (current.value.jobTitle === pos) return
  current.value.jobTitle = pos
  await triggerAutoTailor()
}

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
      location: current.value.location,
      requirements: current.value.requirements || [],
      responsibilities: current.value.responsibilities || [],
      skillsRequired: current.value.skillsRequired || [],
      summary: current.value.summary || '',
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
      // Dynamic fallback template matching job field
      const applicantProfileForGen = {
        ...profileStore.profile,
        educations: profileStore.educations,
        experiences: profileStore.experiences,
        skills: profileStore.skills,
        portfolios: profileStore.portfolios
      }
      const paragraph1 = generateTailoredParagraph1(jobInfo, applicantProfileForGen)
      const paragraph2 = generateTailoredParagraph2()
      const city = profileStore.profile.location ? profileStore.profile.location.split(',').pop().trim() : 'Magelang'
      const companyCity = cleanLocationCity(current.value.location, current.value.companyName)
      const today = formatIndonesianDate()

      const fullCl = formatFullCoverLetterText({
        cityDate: `${city}, ${today}`,
        position: current.value.jobTitle || 'Posisi',
        company: current.value.companyName || 'Perusahaan',
        companyCity,
        applicantName: profileStore.profile.fullName,
        birthPlaceDate: profileStore.profile.birthPlaceDate || 'Magelang, 21 April 2001',
        education: formatDegreeMajor(profileStore.educations?.[0]?.degree, profileStore.educations?.[0]?.major) || 'S1 Teknik Informatika',
        domicile: city,
        phone: profileStore.profile.phone,
        email: profileStore.profile.email,
        bodyParagraph1: paragraph1,
        bodyParagraph2: paragraph2
      })

      tailoredResult = {
        tailoredCoverLetter: fullCl,
        coverLetterParagraph1: paragraph1,
        coverLetterParagraph2: paragraph2,
        emailSubject: `Lamaran Pekerjaan: ${current.value.jobTitle} - ${profileStore.profile.fullName}`,
        professionalSummary: profileStore.profile.bio,
        whatsAppMessage: generateNaturalWhatsAppMessage(jobInfo, applicantProfileForGen),
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

function resetWhatsAppTemplate() {
  const jobInfo = {
    companyName: current.value.companyName,
    jobTitle: current.value.jobTitle,
    location: current.value.location,
    requirements: current.value.requirements || [],
    skillsRequired: current.value.skillsRequired || [],
    summary: current.value.summary || ''
  }
  const applicantProfile = {
    ...profileStore.profile,
    educations: profileStore.educations,
    experiences: profileStore.experiences,
    skills: profileStore.skills
  }
  current.value.tailoredWhatsAppMessage = generateNaturalWhatsAppMessage(jobInfo, applicantProfile)
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
  <div class="space-y-4 sm:space-y-6" :class="hasJob ? 'pb-20 lg:pb-0' : ''">
    <!-- Success Toast Notification -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="-translate-y-3 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-3 opacity-0"
    >
      <div v-if="showSuccessNotification" class="toast bg-emerald-600 text-white" role="status">
        <Check class="w-4 h-4 mt-0.5 shrink-0" />
        <span>{{ successMessage }}</span>
      </div>
    </transition>

    <!-- Page header + status -->
    <div class="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
      <div class="hidden lg:block">
        <h1 class="page-title">Scan & Apply</h1>
        <p class="page-subtitle">Unggah screenshot lowongan, AI menyiapkan surat, CV & pesan — lalu kirim.</p>
      </div>
      <div class="flex items-center gap-2 overflow-x-auto hide-scrollbar bleed-x lg:mx-0 lg:px-0">
        <router-link
          to="/settings"
          class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border"
          :class="activeAiBadge.class"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
          {{ activeAiBadge.text }}
        </router-link>
        <span
          class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border"
          :class="settingsStore.hasSupabase
            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
            : 'bg-slate-100 text-slate-600 border-slate-200'"
        >
          <Database class="w-3.5 h-3.5" />
          {{ settingsStore.hasSupabase ? `${profileStore.portfolios.length} Porto Supabase` : 'Penyimpanan Lokal' }}
        </span>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileInput"
    />

    <!-- ============ UPLOAD: mode penuh (belum ada lowongan) ============ -->
    <div v-if="!hasJob" class="clean-card p-3 sm:p-6">
      <div
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        @click="fileInput?.click()"
        class="group relative border-2 border-dashed rounded-2xl px-5 py-8 sm:p-10 text-center cursor-pointer transition-all duration-150"
        :class="isDragging
          ? 'border-indigo-500 bg-indigo-50/50 ring-4 ring-indigo-100'
          : 'border-slate-300 bg-slate-50/50 hover:border-indigo-400 hover:bg-white'"
      >
        <div class="flex flex-col items-center justify-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
            <Upload class="w-7 h-7" />
          </div>

          <div class="max-w-md">
            <p class="text-base font-bold text-slate-900">
              <span class="lg:hidden">Unggah screenshot lowongan</span>
              <span class="hidden lg:inline">Tarik & letakkan screenshot lowongan di sini</span>
            </p>
            <p class="text-sm text-slate-500 mt-1 leading-relaxed">
              <span class="lg:hidden">Pilih dari galeri — AI akan membaca posisi, email & nomor WA rekruter.</span>
              <span class="hidden lg:inline-flex items-center gap-1.5">
                <ClipboardPaste class="w-4 h-4 text-indigo-600" />
                atau tekan <kbd class="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-mono text-[11px] shadow-xs">Ctrl + V</kbd> untuk paste dari clipboard
              </span>
            </p>
          </div>

          <div class="w-full max-w-xs flex flex-col gap-2.5 lg:flex-row lg:max-w-none lg:w-auto">
            <button type="button" class="btn-primary w-full lg:w-auto" @click.stop="fileInput?.click()">
              <ImageIcon class="w-4 h-4" />
              <span>Pilih Screenshot</span>
            </button>
            <button type="button" class="btn-secondary w-full lg:w-auto" @click.stop="loadDemoSample">
              <Sparkles class="w-4 h-4 text-amber-500" />
              <span>Coba Contoh (Demo)</span>
            </button>
          </div>
        </div>

        <!-- Loading Overlay -->
        <div
          v-if="isBusy"
          class="absolute inset-0 bg-white/95 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center gap-3 z-20 px-6 text-center"
          role="status"
          aria-live="polite"
        >
          <div class="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm font-bold text-slate-800">
            {{ appStore.isScanning ? 'AI sedang membaca screenshot...' : 'Menyesuaikan surat & CV Anda...' }}
          </p>
          <p class="text-xs text-slate-500">Mendeteksi email, No. HP, posisi, dan persyaratan</p>
        </div>
      </div>
    </div>

    <!-- Empty state: alur 3 langkah -->
    <div v-if="!hasJob" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div
        v-for="(step, i) in [
          { t: 'Unggah screenshot', d: 'Dari galeri, drag & drop, atau paste.', icon: Upload },
          { t: 'AI menyesuaikan', d: 'Surat lamaran, CV & pesan WA otomatis.', icon: Sparkles },
          { t: 'Kirim & catat', d: 'Gmail / WhatsApp, tersimpan di Tracker.', icon: Send }
        ]"
        :key="i"
        class="flex sm:flex-col items-center sm:items-start gap-3 p-4 rounded-2xl bg-white border border-slate-200"
      >
        <div class="w-10 h-10 shrink-0 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
          <component :is="step.icon" class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <p class="text-sm font-bold text-slate-900"><span class="text-indigo-600 mr-1">{{ i + 1 }}.</span>{{ step.t }}</p>
          <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">{{ step.d }}</p>
        </div>
      </div>
    </div>

    <!-- ============ UPLOAD: mode ringkas (lowongan aktif) ============ -->
    <div
      v-else
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      class="relative clean-card p-3 flex items-center gap-3 transition-all"
      :class="isDragging ? 'ring-4 ring-indigo-100 border-indigo-400' : ''"
    >
      <div class="w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
        <img v-if="current.screenshotDataUrl" :src="current.screenshotDataUrl" alt="" class="w-full h-full object-cover" />
        <Building v-else class="w-5 h-5" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Lowongan aktif</p>
        <p class="text-sm font-bold text-slate-900 truncate">{{ current.companyName || 'Perusahaan' }}</p>
        <p class="text-xs text-indigo-700 font-medium truncate">{{ current.jobTitle || '—' }}</p>
      </div>
      <button type="button" class="btn-secondary btn-sm shrink-0" @click="fileInput?.click()">
        <Upload class="w-4 h-4" />
        <span>Scan Baru</span>
      </button>

      <div
        v-if="isBusy"
        class="absolute inset-0 bg-white/95 backdrop-blur-xs rounded-2xl flex items-center justify-center gap-3 z-20 px-4"
        role="status"
        aria-live="polite"
      >
        <div class="w-6 h-6 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
        <p class="text-sm font-semibold text-slate-800 truncate">
          {{ appStore.isScanning ? 'AI membaca screenshot...' : 'Menyesuaikan surat & CV...' }}
        </p>
      </div>
    </div>

    <!-- ============ WORKSPACE ============ -->
    <div v-if="hasJob" class="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-6 items-start">

      <!-- Left: Detail Lowongan & Aksi -->
      <div class="xl:col-span-5 2xl:col-span-4 space-y-4">
        <div class="clean-card p-4 sm:p-6 space-y-5">
          <div class="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div class="flex items-center gap-2">
              <Building class="w-4 h-4 text-indigo-600" />
              <h2 class="font-bold text-[15px] text-slate-900">Informasi Lowongan</h2>
            </div>
            <button
              @click="triggerAutoTailor()"
              :disabled="appStore.isTailoring"
              class="btn-ghost btn-sm -mr-2 text-indigo-600"
              title="Sesuaikan ulang dengan AI"
            >
              <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': appStore.isTailoring }" />
              <span>Tailor Ulang</span>
            </button>
          </div>

          <!-- Screenshot Preview -->
          <div v-if="current.screenshotDataUrl" class="hidden sm:block relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-h-48">
            <img :src="current.screenshotDataUrl" alt="Screenshot lowongan" class="w-full h-48 object-contain" />
            <div class="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-white/90 text-[11px] font-medium text-slate-700 shadow-xs border border-slate-200">
              Screenshot Terbaca
            </div>
          </div>

          <!-- Editable Fields -->
          <div class="space-y-4">
            <div>
              <label class="form-label" for="job-company">Perusahaan / Instansi</label>
              <input id="job-company" v-model="current.companyName" type="text" class="form-input" placeholder="Nama Perusahaan" />
            </div>

            <div>
              <label class="form-label" for="job-title">Posisi yang Dilamar</label>
              <input id="job-title" v-model="current.jobTitle" type="text" class="form-input" placeholder="IT Support / Frontend Developer / dll." />
            </div>

            <!-- Pilihan Posisi Multi-Loker di Poster -->
            <div v-if="current.availablePositions?.length > 1" class="p-3 bg-indigo-50/80 border border-indigo-200 rounded-2xl space-y-2">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <span class="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Sparkles class="w-3.5 h-3.5 text-indigo-600" />
                  <span>Poster Membuka {{ current.availablePositions.length }} Posisi</span>
                </span>
                <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                  Prioritas IT Aktif
                </span>
              </div>
              <p class="text-[11px] text-indigo-900/80 leading-relaxed">
                Sistem otomatis memilih posisi yang paling cocok untuk lulusan Teknik Informatika. Klik posisi jika ingin mengganti:
              </p>
              <div class="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                <button
                  v-for="pos in sortedAvailablePositions"
                  :key="pos"
                  type="button"
                  @click="selectAvailablePosition(pos)"
                  class="px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border"
                  :class="current.jobTitle.toLowerCase() === pos.toLowerCase()
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-200 font-semibold'
                    : isPositionItRelated(pos)
                      ? 'bg-white text-indigo-800 border-indigo-200 hover:bg-indigo-50 font-medium'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'"
                >
                  <span v-if="isPositionItRelated(pos)" class="text-[11px]">⭐ Cocok IT</span>
                  <span>{{ pos }}</span>
                </button>
              </div>
            </div>

            <!-- Kontak Rekruter -->
            <div class="p-3.5 sm:p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-4">
              <div class="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles class="w-3.5 h-3.5 text-indigo-600" />
                <span>Kontak Rekruter (Auto-Detect)</span>
              </div>

              <div>
                <label class="flex items-center justify-between gap-2 form-label" for="job-email">
                  <span class="flex items-center gap-1.5"><Mail class="w-4 h-4 text-rose-500" /> Email Rekrutmen</span>
                  <span v-if="current.email?.toLowerCase().includes('gmail.com')" class="text-[11px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                    Gmail
                  </span>
                </label>
                <input id="job-email" v-model="current.email" type="email" inputmode="email" autocomplete="off" class="form-input" placeholder="rekrutmen@gmail.com" />
              </div>

              <div>
                <label class="flex items-center justify-between gap-2 form-label" for="job-phone">
                  <span class="flex items-center gap-1.5"><Phone class="w-4 h-4 text-emerald-600" /> No. WhatsApp / HP</span>
                  <span v-if="current.phone" class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    WA Ready
                  </span>
                </label>
                <input id="job-phone" v-model="current.phone" type="tel" inputmode="tel" autocomplete="off" class="form-input" placeholder="08123456789 atau 62812..." />
              </div>
            </div>

            <!-- Requirements -->
            <div v-if="current.requirements?.length > 0">
              <p class="form-label">Persyaratan Terdeteksi</p>
              <ul class="space-y-1.5 text-[13px] text-slate-600">
                <li v-for="(req, i) in current.requirements.slice(0, 4)" :key="i" class="flex items-start gap-2">
                  <Check class="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span class="leading-relaxed">{{ req }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Aksi Pengiriman -->
          <div class="pt-4 border-t border-slate-100 space-y-2.5">
            <p class="hidden lg:block text-xs font-bold text-slate-500 uppercase tracking-wider">Kirim Lamaran</p>

            <!-- Desktop: tombol utama di kartu. Mobile: di action bar bawah -->
            <button @click="handleOpenGmail" :disabled="!current.email" class="hidden lg:flex btn-gmail w-full min-h-[48px]">
              <Mail class="w-4 h-4" />
              <span>Kirim via Gmail Web</span>
              <ExternalLink class="w-3.5 h-3.5 opacity-80" />
            </button>
            <button @click="handleOpenWhatsApp" :disabled="!current.phone" class="hidden lg:flex btn-wa w-full min-h-[48px]">
              <MessageSquare class="w-4 h-4" />
              <span>Kirim via WhatsApp Web</span>
              <ExternalLink class="w-3.5 h-3.5 opacity-80" />
            </button>

            <button @click="handleSaveToTracker('manual')" class="btn-secondary w-full">
              <Bookmark class="w-4 h-4 text-indigo-600" />
              <span>Simpan ke Riwayat Tracker</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Right: Dokumen -->
      <div class="xl:col-span-7 2xl:col-span-8 space-y-3 sm:space-y-4">
        <div class="flex items-center justify-between xl:hidden pt-2">
          <h2 class="text-[15px] font-bold text-slate-900">Dokumen Lamaran</h2>
        </div>

        <!-- Tabs: 4 kolom sama rata, ikon + label pendek di mobile -->
        <div class="grid grid-cols-4 gap-1 p-1 bg-slate-200/60 rounded-2xl" role="tablist">
          <button
            v-for="tab in docTabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            role="tab"
            :aria-selected="activeTab === tab.key"
            class="min-h-[52px] sm:min-h-[44px] px-1 sm:px-3 rounded-xl text-[11px] sm:text-[13px] font-semibold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 active:scale-[0.97]"
            :class="activeTab === tab.key ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
          >
            <component :is="tab.icon" class="w-[18px] h-[18px] sm:w-4 sm:h-4 shrink-0" />
            <span class="leading-tight text-center">
              <span class="2xl:hidden">{{ tab.short }}</span>
              <span class="hidden 2xl:inline">{{ tab.label }}</span>
            </span>
          </button>
        </div>

        <!-- Tab 1: Surat Lamaran -->
        <div v-show="activeTab === 'cover_letter'" class="xl:h-[80vh] xl:min-h-[750px]">
          <CoverLetterPreview
            :content="current.tailoredCoverLetter"
            @update:content="current.tailoredCoverLetter = $event"
            :bodyParagraph1="current.coverLetterParagraph1"
            :bodyParagraph2="current.coverLetterParagraph2"
            :companyName="current.companyName"
            :positionTitle="current.jobTitle"
            :jobLocation="current.location"
            :jobRequirements="current.requirements"
            :jobSkills="current.skillsRequired"
            :jobSummary="current.summary"
            :applicantName="profileStore.profile.fullName"
          />
        </div>

        <!-- Tab 2: CV -->
        <div v-show="activeTab === 'cv'" class="xl:h-[80vh] xl:min-h-[750px]">
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

        <!-- Tab 3: Portofolio -->
        <div v-show="activeTab === 'portfolio'" class="xl:h-[80vh] xl:min-h-[750px]">
          <PortfolioSelector
            :portfolios="profileStore.portfolios"
            :selectedIds="current.selectedPortfolioIds"
            @toggle="appStore.togglePortfolioSelection"
          />
        </div>

        <!-- Tab 4: Pesan WhatsApp -->
        <div v-show="activeTab === 'wa'" class="clean-card p-4 sm:p-6 space-y-4">
          <div class="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div class="flex items-center gap-2 min-w-0">
              <MessageSquare class="w-4 h-4 text-emerald-600 shrink-0" />
              <h3 class="font-bold text-sm text-slate-900 truncate">Draft Pesan WhatsApp</h3>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="resetWhatsAppTemplate"
                class="btn-secondary btn-sm text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                title="Format ulang pesan WA otomatis dengan gaya bahasa natural & ramah"
              >
                <Sparkles class="w-4 h-4 text-emerald-600" />
                <span class="hidden sm:inline">Format Ulang</span>
              </button>
              <button @click="copyWhatsAppMessage" class="btn-secondary btn-sm shrink-0">
                <component :is="copiedWa ? Check : Copy" class="w-4 h-4" :class="copiedWa ? 'text-emerald-600' : 'text-slate-500'" />
                <span>{{ copiedWa ? 'Tersalin!' : 'Salin' }}</span>
              </button>
            </div>
          </div>

          <!-- Panduan -->
          <details class="group rounded-2xl bg-emerald-50/60 border border-emerald-200/90 text-[13px]" open>
            <summary class="list-none cursor-pointer flex items-center justify-between gap-2 px-3.5 min-h-[44px] font-bold text-emerald-900">
              <span class="flex items-center gap-1.5">
                <Check class="w-4 h-4 text-emerald-600" />
                Cara kirim CV & Porto via WA
              </span>
              <ChevronRight class="w-4 h-4 text-emerald-700 transition-transform group-open:rotate-90" />
            </summary>
            <ol class="list-decimal pl-8 pr-4 pb-3.5 text-emerald-800 space-y-1.5 text-xs leading-relaxed">
              <li><strong>Unduh PDF CV</strong> di tab <em>CV</em>.</li>
              <li><strong>Buka WhatsApp</strong> — teks perkenalan sudah terisi otomatis.</li>
              <li><strong>Lampirkan</strong> file PDF CV (📎 Dokumen), lalu kirim.</li>
            </ol>
          </details>

          <div>
            <label class="form-label" for="wa-message">Isi pesan (bisa disesuaikan)</label>
            <textarea
              id="wa-message"
              v-model="current.tailoredWhatsAppMessage"
              rows="10"
              class="form-input"
              placeholder="Tulis pesan WhatsApp..."
            ></textarea>
          </div>

          <div class="flex items-center gap-1.5 text-xs text-slate-500">
            <Phone class="w-4 h-4 text-emerald-600" />
            <span>Tujuan: <strong class="text-slate-700">{{ current.phone || 'Belum terdeteksi' }}</strong></span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button @click="activeTab = 'cv'" class="btn-secondary w-full">
              <FileText class="w-4 h-4" />
              <span>Unduh PDF CV Dahulu</span>
            </button>
            <button @click="handleOpenWhatsApp" :disabled="!current.phone" class="btn-wa w-full">
              <Send class="w-4 h-4" />
              <span>Buka WhatsApp Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile sticky action bar: aksi utama selalu terjangkau jempol -->
    <div v-if="hasJob" class="mobile-action-bar">
      <div class="max-w-3xl mx-auto grid grid-cols-2 gap-2.5">
        <button @click="handleOpenGmail" :disabled="!current.email" class="btn-gmail w-full">
          <Mail class="w-4 h-4" />
          <span>Gmail</span>
        </button>
        <button @click="handleOpenWhatsApp" :disabled="!current.phone" class="btn-wa w-full">
          <MessageSquare class="w-4 h-4" />
          <span>WhatsApp</span>
        </button>
      </div>
    </div>
  </div>
</template>
