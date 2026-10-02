<script setup>
import { ref, computed, watch } from 'vue'
import { Copy, Check, Download, Edit3, Eye, RotateCcw, Save } from 'lucide-vue-next'
import { exportElementToPdf } from '../services/pdfExport'
import { useProfileStore } from '../stores/profile'

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
  <div class="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
    <!-- Header Toolbar -->
    <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-50 border-b border-slate-200">
      <div class="flex items-center space-x-2">
        <span class="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
        <h3 class="font-semibold text-xs sm:text-sm text-slate-800">Format Surat Lamaran Formal</h3>
        <span class="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 hidden sm:inline">
          Times New Roman • 12pt
        </span>
      </div>
      
      <div class="flex items-center gap-2">
        <!-- Edit Toggle Button -->
        <button
          @click="isEditing = !isEditing"
          class="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-xs"
          :class="isEditing 
            ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'"
        >
          <component :is="isEditing ? Eye : Edit3" class="w-3.5 h-3.5" />
          <span>{{ isEditing ? 'Lihat Dokumen' : 'Edit Isi Surat' }}</span>
        </button>

        <!-- Reset Button -->
        <button
          @click="resetToDefaultTemplate"
          class="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-200 bg-white border border-slate-300 transition-colors shadow-xs"
          title="Reset ke template standar"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span class="hidden md:inline">Reset</span>
        </button>

        <!-- Copy Text -->
        <button
          @click="copyToClipboard"
          class="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-xs"
          title="Salin teks lengkap surat lamaran"
        >
          <component :is="copied ? Check : Copy" class="w-3.5 h-3.5" :class="copied ? 'text-emerald-600' : 'text-slate-500'" />
          <span>{{ copied ? 'Tersalin!' : 'Salin Teks' }}</span>
        </button>

        <!-- Export PDF Button -->
        <button
          @click="handleDownloadPdf"
          :disabled="isExporting"
          class="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-black text-white transition-colors shadow-xs disabled:opacity-50"
        >
          <Download class="w-3.5 h-3.5" />
          <span>{{ isExporting ? 'Membuat PDF...' : 'Download PDF Surat' }}</span>
        </button>
      </div>
    </div>

    <!-- Notification -->
    <div v-if="saveNotice" class="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs text-emerald-800 flex items-center space-x-2">
      <Check class="w-4 h-4 text-emerald-600" />
      <span class="font-medium">Surat lamaran berhasil diperbarui!</span>
    </div>

    <!-- Content Area: Split View when editing, or Paper Document -->
    <div class="overflow-y-auto flex-1 bg-slate-100/70 p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      
      <!-- FORM EDIT (When isEditing is true) -->
      <div v-if="isEditing" class="w-full max-w-3xl mb-8 bg-white p-6 rounded-xl border border-slate-300 shadow-sm space-y-5">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center space-x-2">
            <Edit3 class="w-4 h-4 text-indigo-600" />
            <h4 class="font-bold text-sm text-slate-900">Form Edit Surat Lamaran</h4>
          </div>
          <button
            @click="handleSave"
            class="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <Save class="w-3.5 h-3.5" />
            <span>Terapkan</span>
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Kota & Tanggal Surat</label>
            <input
              v-model="letterData.cityDate"
              type="text"
              class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Perihal / Posisi yang Dilamar</label>
            <input
              v-model="letterData.position"
              type="text"
              class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Nama Perusahaan Penerima</label>
            <input
              v-model="letterData.company"
              type="text"
              class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Kota Perusahaan (Alamat)</label>
            <input
              v-model="letterData.companyCity"
              type="text"
              class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100">
          <h5 class="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">Biodata Pelamar</h5>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Nama Lengkap</label>
              <input
                v-model="letterData.applicantName"
                type="text"
                class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Tempat, Tanggal Lahir</label>
              <input
                v-model="letterData.birthPlaceDate"
                type="text"
                class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Pendidikan Terakhir</label>
              <input
                v-model="letterData.education"
                type="text"
                class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Domisili</label>
              <input
                v-model="letterData.domicile"
                type="text"
                class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">No. HP / WhatsApp</label>
              <input
                v-model="letterData.phone"
                type="text"
                class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Email (Gmail)</label>
              <input
                v-model="letterData.email"
                type="email"
                class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 space-y-3">
          <h5 class="text-xs font-bold uppercase tracking-wider text-slate-700">Isi Surat Lamaran</h5>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Paragraf 1: Pengalaman & Kualifikasi</label>
            <textarea
              v-model="letterData.bodyParagraph1"
              rows="5"
              class="w-full p-3 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
            ></textarea>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Paragraf 2: Lampiran & Kalimat Penutup</label>
            <textarea
              v-model="letterData.bodyParagraph2"
              rows="2"
              class="w-full p-3 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
            ></textarea>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button
            @click="handleSave"
            class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            Terapkan ke Dokumen
          </button>
        </div>
      </div>

      <!-- THE PAPER DOCUMENT (Times New Roman, 12pt, Exact Template from Image) -->
      <div
        id="cover-letter-paper"
        class="w-full max-w-[794px] bg-white text-black p-12 sm:p-16 shadow-lg border border-slate-200 leading-relaxed selection:bg-slate-200"
        style="min-height: 1120px; font-family: 'Times New Roman', Times, serif; font-size: 12pt;"
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
