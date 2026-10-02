<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { Copy, Check, Download, Edit3, Eye, RotateCcw, Save } from 'lucide-vue-next'
import { exportElementToPdf } from '../services/pdfExport'
import { useProfileStore } from '../stores/profile'
import { usePaperScale } from '../composables/usePaperScale'

const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  companyName: {
    type: String,
    default: 'Haluan Lab'
  },
  positionTitle: {
    type: String,
    default: 'AI Co-Pilot'
  },
  applicantName: {
    type: String,
    default: 'Agung Setyawan'
  }
})

const emit = defineEmits(['update:content'])
const profileStore = useProfileStore()

const isEditing = ref(false)
const copied = ref(false)
const isExporting = ref(false)
const saveNotice = ref(false)

// Skala pratinjau kertas agar pas di layar kecil (dinonaktifkan saat export PDF)
const { containerRef: paperWrapRef, paperRef, outerStyle: paperOuterStyle, innerStyle: paperInnerStyle } = usePaperScale(794, isExporting)

// Format tanggal hari ini dalam bahasa Indonesia
const todayIndo = computed(() => {
  const d = new Date()
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
})

// Structured fields matching user's exact template
const letterData = ref({
  cityDate: `Magelang, ${todayIndo.value}`,
  position: props.positionTitle || 'AI Co-Pilot',
  company: props.companyName || 'Haluan Lab',
  companyCity: 'Kota Magelang',
  applicantName: props.applicantName || profileStore.profile.fullName || 'Agung Setyawan',
  birthPlaceDate: 'Magelang, 21 April 2001',
  education: 'S1 Teknik Informatika',
  domicile: 'Magelang',
  phone: profileStore.profile.phone || '+62 857-9116-7764',
  email: profileStore.profile.email || 'agungsetyawa99@gmail.com',
  bodyParagraph1: `Saya memiliki latar belakang S1 Teknik Informatika dan pengalaman dalam pengembangan sistem informasi, termasuk sistem Inventory, Invoice, dan Asset Management untuk Grand Artos Hotel & Convention. Saya terbiasa melakukan analisis kebutuhan, pengembangan aplikasi, pengelolaan database, hingga implementasi sistem dengan teknologi seperti PHP, MySQL, Vue.js, React, Supabase, Vercel, Golang, Laravel, dan CodeIgniter 3/4. Saya memiliki ketertarikan pada AI, automation, dan API, serta senang mempelajari dan menerapkan teknologi baru untuk menyelesaikan berbagai kebutuhan secara efektif. Saya berharap dapat berkontribusi sekaligus mengembangkan kemampuan melalui posisi ${props.positionTitle || 'AI Co-Pilot'} di ${props.companyName || 'Haluan Lab'}.`,
  bodyParagraph2: 'Sebagai bahan pertimbangan, saya siap melampirkan CV dan portofolio. Demikian lamaran ini saya sampaikan. Atas perhatian dan kesempatan yang diberikan, saya ucapkan terima kasih.'
})

// Watch for prop updates from scan/AI
watch(() => props.companyName, (newCompany) => {
  if (newCompany) {
    letterData.value.company = newCompany
    letterData.value.companyCity = `Kota ${newCompany.replace(/^(PT|CV)\s+/i, '')}`
  }
})

watch(() => props.positionTitle, (newPos) => {
  if (newPos) {
    letterData.value.position = newPos
  }
})

// Generate formatted plain text
const fullPlainText = computed(() => {
  return `${letterData.value.cityDate}

Perihal: Lamaran Pekerjaan – ${letterData.value.position}

Yth.
Tim Rekrutmen ${letterData.value.company}
${letterData.value.companyCity}

Dengan hormat,

Saya yang bertanda tangan di bawah ini:
Nama                  : ${letterData.value.applicantName}
Tempat, Tanggal Lahir : ${letterData.value.birthPlaceDate}
Pendidikan            : ${letterData.value.education}
Domisili              : ${letterData.value.domicile}
No. HP/WhatsApp       : ${letterData.value.phone}
Email                 : ${letterData.value.email}

    ${letterData.value.bodyParagraph1}

    ${letterData.value.bodyParagraph2}

Hormat saya,



${letterData.value.applicantName}`
})

// Copy plain text to clipboard
function copyToClipboard() {
  navigator.clipboard.writeText(fullPlainText.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

function handleSave() {
  saveNotice.value = true
  emit('update:content', fullPlainText.value)
  setTimeout(() => {
    saveNotice.value = false
  }, 2500)
}

function resetToDefaultTemplate() {
  letterData.value = {
    cityDate: `Magelang, ${todayIndo.value}`,
    position: props.positionTitle || 'AI Co-Pilot',
    company: props.companyName || 'Haluan Lab',
    companyCity: 'Kota Magelang',
    applicantName: 'Agung Setyawan',
    birthPlaceDate: 'Magelang, 21 April 2001',
    education: 'S1 Teknik Informatika',
    domicile: 'Magelang',
    phone: '+62 857-9116-7764',
    email: 'agungsetyawa99@gmail.com',
    bodyParagraph1: `Saya memiliki latar belakang S1 Teknik Informatika dan pengalaman dalam pengembangan sistem informasi, termasuk sistem Inventory, Invoice, dan Asset Management untuk Grand Artos Hotel & Convention. Saya terbiasa melakukan analisis kebutuhan, pengembangan aplikasi, pengelolaan database, hingga implementasi sistem dengan teknologi seperti PHP, MySQL, Vue.js, React, Supabase, Vercel, Golang, Laravel, dan CodeIgniter 3/4. Saya memiliki ketertarikan pada AI, automation, dan API, serta senang mempelajari dan menerapkan teknologi baru untuk menyelesaikan berbagai kebutuhan secara efektif. Saya berharap dapat berkontribusi sekaligus mengembangkan kemampuan melalui posisi ${props.positionTitle || 'AI Co-Pilot'} di ${props.companyName || 'Haluan Lab'}.`,
    bodyParagraph2: 'Sebagai bahan pertimbangan, saya siap melampirkan CV dan portofolio. Demikian lamaran ini saya sampaikan. Atas perhatian dan kesempatan yang diberikan, saya ucapkan terima kasih.'
  }
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
      <div class="flex items-center gap-2 min-w-0 px-1 sm:px-0">
        <span class="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0"></span>
        <h3 class="font-semibold text-sm text-slate-800 truncate">Surat Lamaran Formal</h3>
        <span class="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 hidden 2xl:inline whitespace-nowrap">
          Times New Roman • 12pt
        </span>
      </div>

      <div class="flex items-center gap-2">
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
          title="Reset ke template standar"
          aria-label="Reset ke template standar"
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

    <!-- Notification -->
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
              <label class="form-label">Email (Gmail)</label>
              <input v-model="letterData.email" type="email" inputmode="email" class="form-input" autocomplete="email" />
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-slate-100 space-y-4">
          <h5 class="text-xs font-bold uppercase tracking-wider text-slate-500">Isi Surat Lamaran</h5>
          <div>
            <label class="form-label">Paragraf 1: Pengalaman & Kualifikasi</label>
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
              <td class="py-0.5 align-top whitespace-nowrap">Tempat, Tanggal Lahir</td>
              <td class="py-0.5 align-top text-center">:</td>
              <td class="py-0.5 align-top">{{ letterData.birthPlaceDate }}</td>
            </tr>
            <tr>
              <td class="py-0.5 align-top whitespace-nowrap">Pendidikan</td>
              <td class="py-0.5 align-top text-center">:</td>
              <td class="py-0.5 align-top">{{ letterData.education }}</td>
            </tr>
            <tr>
              <td class="py-0.5 align-top whitespace-nowrap">Domisili</td>
              <td class="py-0.5 align-top text-center">:</td>
              <td class="py-0.5 align-top">{{ letterData.domicile }}</td>
            </tr>
            <tr>
              <td class="py-0.5 align-top whitespace-nowrap">No. HP/WhatsApp</td>
              <td class="py-0.5 align-top text-center">:</td>
              <td class="py-0.5 align-top">{{ letterData.phone }}</td>
            </tr>
            <tr>
              <td class="py-0.5 align-top whitespace-nowrap">Email</td>
              <td class="py-0.5 align-top text-center">:</td>
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
