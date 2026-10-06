<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { Copy, Check, Download, Edit3, Eye, RotateCcw, Save, Sparkles } from 'lucide-vue-next'
import { exportElementToPdf } from '../services/pdfExport'
import { useProfileStore } from '../stores/profile'
import { usePaperScale } from '../composables/usePaperScale'
import { 
  detectJobCategory, 
  generateTailoredParagraph1, 
  generateTailoredParagraph2, 
  formatFullCoverLetterText, 
  formatIndonesianDate 
} from '../services/coverLetterGenerator'

const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  bodyParagraph1: {
    type: String,
    default: ''
  },
  bodyParagraph2: {
    type: String,
    default: ''
  },
  companyName: {
    type: String,
    default: ''
  },
  positionTitle: {
    type: String,
    default: ''
  },
  jobLocation: {
    type: String,
    default: ''
  },
  jobRequirements: {
    type: Array,
    default: () => []
  },
  jobSkills: {
    type: Array,
    default: () => []
  },
  jobSummary: {
    type: String,
    default: ''
  },
  applicantName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:content'])
const profileStore = useProfileStore()

const isEditing = ref(false)
const copied = ref(false)
const isExporting = ref(false)
const saveNotice = ref(false)
const autoTailoredNotice = ref(false)
const hasManualEdits = ref(false)

// Skala pratinjau kertas agar pas di layar kecil (dinonaktifkan saat export PDF)
const { containerRef: paperWrapRef, paperRef, outerStyle: paperOuterStyle, innerStyle: paperInnerStyle } = usePaperScale(794, isExporting)

// Tanggal hari ini
const todayIndo = computed(() => formatIndonesianDate())

// Structured fields matching standard formal letter template
const letterData = ref({
  cityDate: '',
  position: '',
  company: '',
  companyCity: '',
  applicantName: '',
  birthPlaceDate: '',
  education: '',
  domicile: '',
  phone: '',
  email: '',
  bodyParagraph1: '',
  bodyParagraph2: ''
})

// Deteksi kategori bidang loker saat ini
const currentCategory = computed(() => {
  return detectJobCategory(
    letterData.value.position || props.positionTitle,
    props.jobRequirements,
    props.jobSummary
  )
})

// Helper untuk format kota perusahaan
function resolveCompanyCity(location, company) {
  if (location && location.trim() && !location.toLowerCase().includes('remote')) {
    const loc = location.trim()
    return loc.toLowerCase().startsWith('kota ') || loc.toLowerCase().startsWith('kabupaten ') 
      ? loc 
      : `Kota ${loc}`
  }
  if (company && company.trim()) {
    const cleanComp = company.replace(/^(PT|CV|UD|Firma)\s+/i, '').trim()
    return `Kota ${cleanComp}`
  }
  return 'Di Tempat'
}

// Adapt / tailor letter data based on props & candidate profile
function applyAutoTailoring(force = false) {
  const profile = profileStore.profile || {}
  const educations = profileStore.educations || []
  const city = profile.location ? profile.location.split(',').pop().trim() : 'Magelang'

  const jobInfo = {
    companyName: props.companyName || 'Perusahaan Terkait',
    jobTitle: props.positionTitle || 'Posisi Terkait',
    location: props.jobLocation || '',
    requirements: props.jobRequirements || [],
    skillsRequired: props.jobSkills || [],
    summary: props.jobSummary || ''
  }

  const applicantProfile = {
    ...profile,
    educations,
    experiences: profileStore.experiences || [],
    skills: profileStore.skills || [],
    portfolios: profileStore.portfolios || []
  }

  const s1Edu = educations.find(e => 
    (e.degree && /s1|sarjana/i.test(e.degree)) || 
    (e.major && /informatika/i.test(e.major))
  )
  const bestEdu = s1Edu 
    ? `${s1Edu.degree || 'S1'} ${s1Edu.major || 'Teknik Informatika'}`.trim()
    : (educations[0]?.degree ? `${educations[0].degree} ${educations[0].major || ''}`.trim() : 'S1 Teknik Informatika')

  letterData.value.cityDate = `${city}, ${todayIndo.value}`
  letterData.value.position = props.positionTitle || 'Posisi Terkait'
  letterData.value.company = props.companyName || 'Perusahaan Terkait'
  letterData.value.companyCity = resolveCompanyCity(props.jobLocation, props.companyName)
  letterData.value.applicantName = props.applicantName || profile.fullName || 'Agung Setyawan'
  letterData.value.birthPlaceDate = profile.birthPlaceDate || 'Magelang, 21 April 2001'
  letterData.value.education = bestEdu
  letterData.value.domicile = city
  letterData.value.phone = profile.phone || '+62 821-3549-0941'
  letterData.value.email = profile.email || 'aggungset04@gmail.com'

  // Jika dipaksa atau belum ada editan manual, sesuaikan paragraf sesuai bidang loker
  if (force || !hasManualEdits.value) {
    if (props.bodyParagraph1) {
      letterData.value.bodyParagraph1 = props.bodyParagraph1
    } else {
      letterData.value.bodyParagraph1 = generateTailoredParagraph1(jobInfo, applicantProfile)
    }

    if (props.bodyParagraph2) {
      letterData.value.bodyParagraph2 = props.bodyParagraph2
    } else {
      letterData.value.bodyParagraph2 = generateTailoredParagraph2()
    }
  }

  emit('update:content', fullPlainText.value)
}

// Generate formatted plain text
const fullPlainText = computed(() => {
  return formatFullCoverLetterText(letterData.value)
})

// Watch for prop updates from scan/AI
watch(() => props.bodyParagraph1, (newP1) => {
  if (newP1 && newP1.trim()) {
    letterData.value.bodyParagraph1 = newP1
    hasManualEdits.value = false
    emit('update:content', fullPlainText.value)
  }
})

watch(() => props.bodyParagraph2, (newP2) => {
  if (newP2 && newP2.trim()) {
    letterData.value.bodyParagraph2 = newP2
    emit('update:content', fullPlainText.value)
  }
})

watch(() => props.companyName, (newCompany) => {
  if (newCompany && newCompany !== letterData.value.company) {
    letterData.value.company = newCompany
    letterData.value.companyCity = resolveCompanyCity(props.jobLocation, newCompany)
    if (!hasManualEdits.value && !props.bodyParagraph1) {
      applyAutoTailoring(true)
    }
  }
})

watch(() => props.positionTitle, (newPos) => {
  if (newPos && newPos !== letterData.value.position) {
    letterData.value.position = newPos
    if (!hasManualEdits.value && !props.bodyParagraph1) {
      applyAutoTailoring(true)
    }
  }
})

watch(() => props.jobLocation, (newLoc) => {
  if (newLoc) {
    letterData.value.companyCity = resolveCompanyCity(newLoc, letterData.value.company)
  }
})

watch(() => props.jobRequirements, () => {
  if (!hasManualEdits.value && !props.bodyParagraph1) {
    applyAutoTailoring(true)
  }
}, { deep: true })

onMounted(() => {
  applyAutoTailoring(false)
})

// Manual trigger auto tailor
function handleTriggerAutoTailor() {
  hasManualEdits.value = false
  applyAutoTailoring(true)
  autoTailoredNotice.value = true
  setTimeout(() => {
    autoTailoredNotice.value = false
  }, 3000)
}

// Copy plain text to clipboard
function copyToClipboard() {
  navigator.clipboard.writeText(fullPlainText.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

function handleSave() {
  hasManualEdits.value = true
  saveNotice.value = true
  emit('update:content', fullPlainText.value)
  setTimeout(() => {
    saveNotice.value = false
  }, 2500)
}

function resetToDefaultTemplate() {
  hasManualEdits.value = false
  applyAutoTailoring(true)
}

async function handleDownloadPdf() {
  try {
    isExporting.value = true
    await nextTick()
    const cleanCompany = (letterData.value.company || 'Perusahaan').replace(/\s+/g, '_')
    const cleanName = (letterData.value.applicantName || 'Pelamar').replace(/\s+/g, '_')
    const filename = `Surat_Lamaran_${cleanName}_${cleanCompany}.pdf`
    await exportElementToPdf('cover-letter-paper', filename)
  } catch (err) {
    alert('Gagal mendownload PDF Surat Lamaran: ' + err.message)
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
    <!-- Header Toolbar -->
    <div class="px-3 py-3 sm:px-5 bg-slate-50 border-b border-slate-200 flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between md:gap-3 xl:flex-col xl:items-stretch 2xl:flex-row 2xl:items-center">
      <div class="flex items-center gap-2 min-w-0 px-1 sm:px-0 flex-wrap">
        <span class="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0"></span>
        <h3 class="font-semibold text-sm text-slate-800 truncate">Surat Lamaran Formal</h3>
        
        <!-- Detected Field Badge -->
        <span 
          class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1 shrink-0"
          :class="currentCategory.key !== 'general' 
            ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
            : 'bg-slate-100 text-slate-600 border-slate-200'"
          title="Bidang pekerjaan terdeteksi otomatis dari judul dan kualifikasi lowongan"
        >
          <Sparkles class="w-3 h-3 text-indigo-500" />
          <span>Bidang: {{ currentCategory.label }}</span>
        </span>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <!-- Button: Sesuaikan Otomatis -->
        <button
          @click="handleTriggerAutoTailor"
          class="btn-secondary btn-sm text-indigo-700 border-indigo-200 hover:bg-indigo-50"
          title="Sesuaikan ulang paragraf isi surat otomatis dengan bidang lowongan saat ini"
        >
          <Sparkles class="w-4 h-4 text-indigo-600" />
          <span class="hidden sm:inline">Sesuaikan Otomatis</span>
        </button>

        <!-- Edit Toggle Button -->
        <button
          @click="isEditing = !isEditing"
          class="btn btn-sm flex-1 md:flex-none xl:flex-1 2xl:flex-none"
          :class="isEditing
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'"
        >
          <component :is="isEditing ? Eye : Edit3" class="w-4 h-4" />
          <span>{{ isEditing ? 'Pratinjau' : 'Edit' }}<span v-if="!isEditing" class="hidden sm:inline"> Surat</span></span>
        </button>

        <!-- Copy Text -->
        <button
          @click="copyToClipboard"
          class="btn-secondary btn-sm w-10 px-0 sm:w-auto sm:px-3"
          :title="copied ? 'Tersalin!' : 'Salin teks lengkap surat lamaran'"
          :aria-label="copied ? 'Tersalin' : 'Salin teks surat'"
        >
          <component :is="copied ? Check : Copy" class="w-4 h-4" :class="copied ? 'text-emerald-600' : 'text-slate-500'" />
          <span class="hidden sm:inline">{{ copied ? 'Tersalin!' : 'Salin' }}</span>
        </button>

        <!-- Reset Button -->
        <button
          @click="resetToDefaultTemplate"
          class="btn-secondary btn-sm w-10 px-0 xl:w-auto xl:px-3"
          title="Reset & sesuaikan otomatis ke bidang lowongan ini"
          aria-label="Reset ke format bidang lowongan ini"
        >
          <RotateCcw class="w-4 h-4 text-slate-500" />
          <span class="hidden xl:inline">Reset</span>
        </button>

        <!-- Export PDF Button -->
        <button
          @click="handleDownloadPdf"
          :disabled="isExporting"
          class="btn-dark btn-sm flex-1 md:flex-none xl:flex-1 2xl:flex-none"
        >
          <Download class="w-4 h-4" />
          <span>{{ isExporting ? 'Membuat...' : 'PDF' }}<span class="hidden sm:inline">{{ isExporting ? '' : ' Surat' }}</span></span>
        </button>
      </div>
    </div>

    <!-- Notification: Auto tailored -->
    <div v-if="autoTailoredNotice" class="bg-indigo-50 border-b border-indigo-200 px-4 py-2.5 text-[13px] text-indigo-900 flex items-center gap-2" role="status">
      <Sparkles class="w-4 h-4 text-indigo-600 shrink-0" />
      <span class="font-medium">Surat lamaran berhasil disesuaikan otomatis untuk bidang: <strong>{{ currentCategory.label }}</strong>!</span>
    </div>

    <!-- Notification: Save manual edits -->
    <div v-if="saveNotice" class="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 text-[13px] text-emerald-800 flex items-center gap-2" role="status">
      <Check class="w-4 h-4 text-emerald-600 shrink-0" />
      <span class="font-medium">Surat lamaran berhasil diperbarui!</span>
    </div>

    <!-- Content Area -->
    <div class="xl:overflow-y-auto flex-1 bg-slate-100/70 p-3 sm:p-6 lg:p-8 flex flex-col items-center">

      <!-- FORM EDIT (When isEditing is true) -->
      <div v-if="isEditing" class="w-full max-w-3xl mb-4 lg:mb-8 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div class="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2">
            <Edit3 class="w-4 h-4 text-indigo-600" />
            <h4 class="font-bold text-sm text-slate-900">Edit Surat Lamaran</h4>
          </div>
          <button @click="handleSave" class="btn-primary btn-sm hidden sm:inline-flex">
            <Save class="w-4 h-4" />
            <span>Terapkan</span>
          </button>
        </div>

        <!-- Info Tip -->
        <div class="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-800 flex items-center gap-2">
          <Sparkles class="w-4 h-4 text-indigo-600 shrink-0" />
          <span>Isi surat di bawah ini otomatis disesuaikan untuk lowongan bidang <strong>{{ currentCategory.label }}</strong>. Anda bebas menyempurnakan atau menyesuaikan kalimat secara manual.</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Kota & Tanggal Surat</label>
            <input v-model="letterData.cityDate" type="text" class="form-input" />
          </div>
          <div>
            <label class="form-label">Perihal / Posisi yang Dilamar</label>
            <input v-model="letterData.position" type="text" class="form-input" />
          </div>
          <div>
            <label class="form-label">Nama Perusahaan Penerima</label>
            <input v-model="letterData.company" type="text" class="form-input" />
          </div>
          <div>
            <label class="form-label">Kota Perusahaan (Alamat)</label>
            <input v-model="letterData.companyCity" type="text" class="form-input" />
          </div>
        </div>

        <div class="pt-4 border-t border-slate-100">
          <h5 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Biodata Pelamar</h5>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="form-label">Nama Lengkap</label>
              <input v-model="letterData.applicantName" type="text" class="form-input" autocomplete="name" />
            </div>
            <div>
              <label class="form-label">Tempat, Tanggal Lahir</label>
              <input v-model="letterData.birthPlaceDate" type="text" class="form-input" />
            </div>
            <div>
              <label class="form-label">Pendidikan Terakhir</label>
              <input v-model="letterData.education" type="text" class="form-input" />
            </div>
            <div>
              <label class="form-label">Domisili</label>
              <input v-model="letterData.domicile" type="text" class="form-input" />
            </div>
            <div>
              <label class="form-label">No. HP / WhatsApp</label>
              <input v-model="letterData.phone" type="tel" inputmode="tel" class="form-input" autocomplete="tel" />
            </div>
            <div>
              <label class="form-label">Email</label>
              <input v-model="letterData.email" type="email" inputmode="email" class="form-input" autocomplete="email" />
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-slate-100 space-y-4">
          <div class="flex items-center justify-between gap-2">
            <h5 class="text-xs font-bold uppercase tracking-wider text-slate-500">Isi Surat Lamaran</h5>
            <button 
              type="button" 
              @click="handleTriggerAutoTailor" 
              class="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              <Sparkles class="w-3.5 h-3.5" />
              <span>Generate ulang paragraf bidang ini</span>
            </button>
          </div>
          <div>
            <label class="form-label">Paragraf 1: Pengalaman & Kualifikasi (Disesuaikan Bidang Loker)</label>
            <textarea v-model="letterData.bodyParagraph1" rows="7" class="form-input"></textarea>
          </div>
          <div>
            <label class="form-label">Paragraf 2: Lampiran & Kalimat Penutup</label>
            <textarea v-model="letterData.bodyParagraph2" rows="3" class="form-input"></textarea>
          </div>
        </div>

        <div class="pt-1 flex sm:justify-end">
          <button @click="handleSave" class="btn-primary w-full sm:w-auto">
            <Save class="w-4 h-4" />
            <span>Terapkan ke Dokumen</span>
          </button>
        </div>
      </div>

      <!-- THE PAPER DOCUMENT (Times New Roman, 12pt) — diskalakan agar pas layar -->
      <p v-if="!isEditing" class="lg:hidden w-full text-center text-[11px] text-slate-400 mb-2">
        Pratinjau diperkecil agar pas layar • PDF tetap ukuran A4
      </p>
      <div
        ref="paperWrapRef"
        class="w-full max-w-[794px] mx-auto"
        :class="isEditing && !isExporting ? 'hidden lg:block' : ''"
        :style="paperOuterStyle"
      >
      <div
        id="cover-letter-paper"
        ref="paperRef"
        class="w-[794px] bg-white text-black p-16 shadow-lg border border-slate-200 leading-relaxed selection:bg-slate-200"
        style="min-height: 1120px; font-family: 'Times New Roman', Times, serif; font-size: 12pt;"
        :style="paperInnerStyle"
      >
        <!-- 1. Kota dan Tanggal (Kanan Atas) -->
        <div class="text-right mb-6 text-[12pt]">
          {{ letterData.cityDate }}
        </div>

        <!-- 2. Perihal (Kiri) -->
        <div class="mb-5 text-[12pt]">
          Perihal: Lamaran Pekerjaan – {{ letterData.position }}
        </div>

        <!-- 3. Alamat Tujuan / Penerima -->
        <div class="mb-5 text-[12pt] leading-snug">
          <div>Yth.</div>
          <div>Tim Rekrutmen {{ letterData.company }}</div>
          <div>{{ letterData.companyCity }}</div>
        </div>

        <!-- 4. Salam Pembuka -->
        <div class="mb-4 text-[12pt]">
          Dengan hormat,
        </div>

        <!-- 5. Pernyataan Awal -->
        <div class="mb-2 text-[12pt]">
          Saya yang bertanda tangan di bawah ini:
        </div>

        <!-- 6. Tabel Biodata (Format Kolom Titik Dua Rapi) -->
        <table class="w-full max-w-xl mb-6 text-[12pt] border-collapse" style="font-family: inherit;">
          <tbody>
            <tr>
              <td class="w-48 py-0.5 align-top whitespace-nowrap">Nama</td>
              <td class="w-4 py-0.5 align-top text-center">:</td>
              <td class="py-0.5 align-top">{{ letterData.applicantName }}</td>
            </tr>
            <tr>
              <td class="w-48 py-0.5 align-top whitespace-nowrap">Tempat, Tanggal Lahir</td>
              <td class="w-4 py-0.5 align-top text-center">:</td>
              <td class="py-0.5 align-top">{{ letterData.birthPlaceDate }}</td>
            </tr>
            <tr>
              <td class="w-48 py-0.5 align-top whitespace-nowrap">Pendidikan</td>
              <td class="w-4 py-0.5 align-top text-center">:</td>
              <td class="py-0.5 align-top">{{ letterData.education }}</td>
            </tr>
            <tr>
              <td class="w-48 py-0.5 align-top whitespace-nowrap">Domisili</td>
              <td class="w-4 py-0.5 align-top text-center">:</td>
              <td class="py-0.5 align-top">{{ letterData.domicile }}</td>
            </tr>
            <tr>
              <td class="w-48 py-0.5 align-top whitespace-nowrap">No. HP/WhatsApp</td>
              <td class="w-4 py-0.5 align-top text-center">:</td>
              <td class="py-0.5 align-top">{{ letterData.phone }}</td>
            </tr>
            <tr>
              <td class="w-48 py-0.5 align-top whitespace-nowrap">Email</td>
              <td class="w-4 py-0.5 align-top text-center">:</td>
              <td class="py-0.5 align-top">{{ letterData.email }}</td>
            </tr>
          </tbody>
        </table>

        <!-- 7. Paragraf Isi Utama (Indentasi Paragraf Awal & Rata Kiri Kanan) -->
        <div class="space-y-4 text-[12pt] text-justify" style="line-height: 1.6;">
          <p style="text-indent: 2.5rem;">
            {{ letterData.bodyParagraph1 }}
          </p>

          <!-- 8. Paragraf Penutup -->
          <p style="text-indent: 2.5rem;">
            {{ letterData.bodyParagraph2 }}
          </p>
        </div>

        <!-- 9. Tanda Tangan & Nama Terang (Kiri Bawah) -->
        <div class="mt-10 text-[12pt]">
          <div class="mb-20">Hormat saya,</div>
          <div class="font-normal">{{ letterData.applicantName }}</div>
        </div>

      </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
#cover-letter-paper {
  font-family: 'Times New Roman', Times, serif !important;
  font-size: 12pt !important;
  color: #000000 !important;
}

#cover-letter-paper p,
#cover-letter-paper td,
#cover-letter-paper div {
  font-family: 'Times New Roman', Times, serif !important;
}
</style>
