<script setup>
import { ref, watch, nextTick } from 'vue'
import { 
  Download, 
  Check, 
  Mail, 
  Phone, 
  MapPin, 
  Edit3, 
  Eye, 
  Plus, 
  Trash2, 
  RotateCcw,
  Sparkles,
  Layers,
  Save,
  Printer
} from 'lucide-vue-next'
import { exportCvToTextPdf, printDocument, exportElementToPdf } from '../services/pdfExport'
import { useProfileStore } from '../stores/profile'
import { usePaperScale } from '../composables/usePaperScale'

const props = defineProps({
  profile: {
    type: Object,
    required: true
  },
  experiences: {
    type: Array,
    default: () => []
  },
  educations: {
    type: Array,
    default: () => []
  },
  skills: {
    type: Array,
    default: () => []
  },
  portfolios: {
    type: Array,
    default: () => []
  },
  selectedPortfolioIds: {
    type: Array,
    default: () => []
  },
  tailoredSummary: {
    type: String,
    default: ''
  },
  targetPosition: {
    type: String,
    default: ''
  }
})

const profileStore = useProfileStore()

const isEditing = ref(false)
const isExporting = ref(false)
const saveNotice = ref(false)

// Skala pratinjau kertas agar pas di layar kecil (dinonaktifkan saat export PDF)
const { containerRef: paperWrapRef, paperRef, outerStyle: paperOuterStyle, innerStyle: paperInnerStyle } = usePaperScale(794, isExporting)

// Local editable state initialized from props & store or user's exact CV
const cvData = ref({
  fullName: props.profile.fullName || 'Agung Setyawan',
  phone: props.profile.phone || '+62 821-3549-0941',
  email: props.profile.email || 'aggungset04@gmail.com',
  location: props.profile.location || 'Kleteran , Grabag , Magelang',
  aboutMe: props.tailoredSummary || props.profile.bio || 'Saya Agung Setyawan, lulusan S1 Teknik Informatika dengan ketertarikan kuat pada tiga bidang utama, yaitu pengembangan web, jaringan komputer, dan pengolahan data menggunakan Python. Selain itu, saya juga memiliki kemampuan dalam maintenance PC serta perangkat IT lainnya.',
  
  // Pendidikan
  educationHeader: '2020 - 2024 | S1 Teknik Informatika',
  educationDesc: 'Fokus studi pada rekayasa perangkat lunak, pengembangan sistem web, arsitektur jaringan komputer, basis data, serta pemecahan masalah komputasi dan implementasi teknologi informasi.',
  
  // Projects list
  projects: [
    {
      id: 'p-1',
      title: 'Prediksi IHSG Menggunakan Python',
      description: 'Menganalisis data historis IHSG dengan Python untuk memprediksi pergerakan indeks melalui pengolahan data, analisis tren, dan model prediksi sederhana.'
    },
    {
      id: 'p-2',
      title: 'Implementasi Jaringan dan Sistem Administrasi Swalayan',
      description: 'Selama kerja, saya bertugas melakukan instalasi jaringan komputer, mendukung sistem administrasi internal, serta memberikan dukungan teknis agar operasional swalayan berjalan lancar.'
    },
    {
      id: 'p-3',
      title: 'Implementasi Sistem Asset dan Helpdesk di Grand Artos Hotel & Convention',
      description: 'Membuat sistem manajemen aset untuk mengelola dan memantau perangkat IT seperti PC, printer, CCTV, dan UPS secara terstruktur, serta membangun sistem help desk untuk pelaporan keluhan, pemantauan tiket, dan percepatan penanganan masalah IT di lingkungan hotel.'
    },
    {
      id: 'p-4',
      title: 'Sistem Inventory Gudang Grand Artos Hotel & Convention',
      description: 'Membuat sistem inventory gudang untuk mengelola dan memantau stok perlengkapan operasional hotel seperti piring, pisau, dan peralatan lainnya, sehingga proses pencatatan, pelacakan, dan pengendalian stok menjadi lebih efisien dan terorganisir.'
    }
  ],

  // Referensi
  reference: {
    name: 'Haritrisna Suryadimarta',
    position: 'Asst. IT Manager – Grand Artos Hotel & Convention',
    phone: '+62 856-2717-803'
  }
})

// Keep updated if tailored summary changes from AI
watch(() => props.tailoredSummary, (newVal) => {
  if (newVal && newVal.trim()) {
    cvData.value.aboutMe = newVal
  }
})

// Add new custom project
function addProject() {
  cvData.value.projects.push({
    id: 'p-' + Date.now(),
    title: 'Judul Proyek Baru',
    description: 'Deskripsi tanggung jawab, teknologi, dan hasil dari proyek ini.'
  })
}

// Remove project
function removeProject(index) {
  cvData.value.projects.splice(index, 1)
}

// Quick import project from Supabase portfolio
function importFromPortfolio(port) {
  cvData.value.projects.push({
    id: 'port-' + port.id,
    title: port.title,
    description: port.description || 'Proyek pengembangan sistem aplikasi berbasis web.'
  })
}

// Save changes to profile store so it persists across sessions & syncs
function handleSave() {
  profileStore.saveProfile({
    fullName: cvData.value.fullName,
    phone: cvData.value.phone,
    email: cvData.value.email,
    location: cvData.value.location,
    bio: cvData.value.aboutMe
  })

  // Also save to localStorage specific CV state
  localStorage.setItem('autoapply_custom_cv', JSON.stringify(cvData.value))

  saveNotice.value = true
  setTimeout(() => {
    saveNotice.value = false
  }, 2500)
}

// Reset to default CV data matching the image
function resetToImageSample() {
  cvData.value = {
    fullName: 'Agung Setyawan',
    phone: '+62 821-3549-0941',
    email: 'aggungset04@gmail.com',
    location: 'Kleteran , Grabag , Magelang',
    aboutMe: 'Saya Agung Setyawan, lulusan S1 Teknik Informatika dengan ketertarikan kuat pada tiga bidang utama, yaitu pengembangan web, jaringan komputer, dan pengolahan data menggunakan Python. Selain itu, saya juga memiliki kemampuan dalam maintenance PC serta perangkat IT lainnya.',
    educationHeader: '2020 - 2024 | S1 Teknik Informatika',
    educationDesc: 'Fokus studi pada rekayasa perangkat lunak, pengembangan sistem web, arsitektur jaringan komputer, basis data, serta pemecahan masalah komputasi dan implementasi teknologi informasi.',
    projects: [
      {
        id: 'p-1',
        title: 'Prediksi IHSG Menggunakan Python',
        description: 'Menganalisis data historis IHSG dengan Python untuk memprediksi pergerakan indeks melalui pengolahan data, analisis tren, dan model prediksi sederhana.'
      },
      {
        id: 'p-2',
        title: 'Implementasi Jaringan dan Sistem Administrasi Swalayan',
        description: 'Selama kerja, saya bertugas melakukan instalasi jaringan komputer, mendukung sistem administrasi internal, serta memberikan dukungan teknis agar operasional swalayan berjalan lancar.'
      },
      {
        id: 'p-3',
        title: 'Implementasi Sistem Asset dan Helpdesk di Grand Artos Hotel & Convention',
        description: 'Membuat sistem manajemen aset untuk mengelola dan memantau perangkat IT seperti PC, printer, CCTV, dan UPS secara terstruktur, serta membangun sistem help desk untuk pelaporan keluhan, pemantauan tiket, dan percepatan penanganan masalah IT di lingkungan hotel.'
      },
      {
        id: 'p-4',
        title: 'Sistem Inventory Gudang Grand Artos Hotel & Convention',
        description: 'Membuat sistem inventory gudang untuk mengelola dan memantau stok perlengkapan operasional hotel seperti piring, pisau, dan peralatan lainnya, sehingga proses pencatatan, pelacakan, dan pengendalian stok menjadi lebih efisien dan terorganisir.'
      }
    ],
    reference: {
      name: 'Haritrisna Suryadimarta',
      position: 'Asst. IT Manager – Grand Artos Hotel & Convention',
      phone: '+62 856-2717-803'
    }
  }
  handleSave()
}

// Load saved custom CV on mount if exists (and sanitize old 'mahasiswa' cached data)
const savedCv = localStorage.getItem('autoapply_custom_cv')
if (savedCv) {
  try {
    const parsed = JSON.parse(savedCv)
    if (parsed.aboutMe && /mahasiswa/i.test(parsed.aboutMe)) {
      parsed.aboutMe = parsed.aboutMe
        .replace(/mahasiswa\s*(akhir)?\s*Teknik Informatika/gi, 'lulusan S1 Teknik Informatika')
        .replace(/mahasiswa\s*(akhir)?/gi, 'lulusan S1')
    }
    if (parsed.educationHeader && /SMAN 1 Grabag/i.test(parsed.educationHeader) && !/Informatika/i.test(parsed.educationHeader)) {
      parsed.educationHeader = '2020 - 2024 | S1 Teknik Informatika'
      parsed.educationDesc = 'Fokus studi pada rekayasa perangkat lunak, pengembangan sistem web, arsitektur jaringan komputer, basis data, serta pemecahan masalah komputasi dan implementasi teknologi informasi.'
    }
    cvData.value = { ...cvData.value, ...parsed }
  } catch (e) {
    console.warn('Could not parse saved custom CV:', e)
  }
}

async function handleDownloadPdf() {
  try {
    isExporting.value = true
    await nextTick()
    const filename = `CV_${(cvData.value.fullName || 'Pelamar').replace(/\s+/g, '_')}.pdf`
    // Ekspor PDF Berbasis Teks Asli (Vector / Pure Text ATS-Friendly)
    exportCvToTextPdf(cvData.value, filename)
  } catch (err) {
    console.warn('Gagal dengan text PDF, mencoba fallback canvas:', err)
    try {
      const filename = `CV_${(cvData.value.fullName || 'Pelamar').replace(/\s+/g, '_')}.pdf`
      await exportElementToPdf('cv-document-paper', filename)
    } catch (fallbackErr) {
      alert('Gagal mendownload PDF CV: ' + fallbackErr.message)
    }
  } finally {
    isExporting.value = false
  }
}

function handlePrint() {
  const title = `CV - ${cvData.value.fullName || 'Pelamar'}`
  printDocument('cv-document-paper', title)
}
</script>

<template>
  <div class="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
    <!-- Header Toolbar -->
    <div class="px-3 py-3 sm:px-5 bg-slate-50 border-b border-slate-200 flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between md:gap-3 xl:flex-col xl:items-stretch 2xl:flex-row 2xl:items-center">
      <div class="flex items-center gap-2 min-w-0 px-1 sm:px-0">
        <span class="w-2.5 h-2.5 rounded-full bg-slate-900 shrink-0"></span>
        <h3 class="font-semibold text-sm text-slate-800 truncate">CV Standar Profesional</h3>
        <span class="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 hidden 2xl:inline whitespace-nowrap">
          ATS Friendly
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
          <span>{{ isEditing ? 'Pratinjau' : 'Edit' }}<span v-if="!isEditing" class="hidden sm:inline"> CV</span></span>
        </button>

        <!-- Reset Button -->
        <button
          @click="resetToImageSample"
          class="btn-secondary btn-sm w-10 px-0 xl:w-auto xl:px-3"
          title="Reset ke data contoh CV"
          aria-label="Reset ke data contoh CV"
        >
          <RotateCcw class="w-4 h-4 text-slate-500" />
          <span class="hidden xl:inline">Reset</span>
        </button>

        <!-- Print / Cetak via Browser (Save as PDF) -->
        <button
          @click="handlePrint"
          class="btn-secondary btn-sm px-2.5"
          title="Cetak atau Simpan sebagai PDF via dialog cetak browser (100% Vector Text)"
        >
          <Printer class="w-4 h-4 text-slate-600" />
          <span class="hidden sm:inline">Cetak</span>
        </button>

        <!-- Export PDF Button (ATS Text Direct Download) -->
        <button
          @click="handleDownloadPdf"
          :disabled="isExporting"
          class="btn-dark btn-sm flex-1 md:flex-none xl:flex-1 2xl:flex-none"
          title="Download langsung file PDF berbasis teks vektor asli (Lolos ATS)"
        >
          <Download class="w-4 h-4" />
          <span>{{ isExporting ? 'Membuat...' : 'Download PDF' }}</span>
        </button>
      </div>
    </div>

    <!-- Notification Bar -->
    <div v-if="saveNotice" class="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 text-[13px] text-emerald-800 flex items-center justify-between gap-2" role="status">
      <div class="flex items-center gap-2">
        <Check class="w-4 h-4 text-emerald-600 shrink-0" />
        <span class="font-medium">Perubahan CV berhasil disimpan!</span>
      </div>
      <span class="hidden sm:inline text-[11px] text-emerald-600">Otomatis sinkron ke profil</span>
    </div>

    <!-- Content Area -->
    <div class="xl:overflow-y-auto flex-1 bg-slate-100/70 p-3 sm:p-6 lg:p-8 flex flex-col items-center">

      <!-- EDIT PANEL -->
      <div v-if="isEditing" class="w-full max-w-3xl mb-4 lg:mb-8 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div class="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2">
            <Edit3 class="w-4 h-4 text-indigo-600" />
            <h4 class="font-bold text-sm text-slate-900">Edit Data CV</h4>
          </div>
          <button @click="handleSave" class="btn-primary btn-sm hidden sm:inline-flex">
            <Save class="w-4 h-4" />
            <span>Simpan</span>
          </button>
        </div>

        <!-- 1. Kontak & Identitas -->
        <section>
          <h5 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">1. Identitas & Kontak</h5>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="form-label">Nama Lengkap</label>
              <input v-model="cvData.fullName" type="text" class="form-input" autocomplete="name" />
            </div>
            <div>
              <label class="form-label">Nomor Telepon / WhatsApp</label>
              <input v-model="cvData.phone" type="tel" inputmode="tel" class="form-input" autocomplete="tel" />
            </div>
            <div>
              <label class="form-label">Email (Gmail)</label>
              <input v-model="cvData.email" type="email" inputmode="email" class="form-input" autocomplete="email" />
            </div>
            <div>
              <label class="form-label">Alamat / Domisili</label>
              <input v-model="cvData.location" type="text" class="form-input" />
            </div>
          </div>
        </section>

        <!-- 2. Tentang Saya -->
        <section class="pt-5 border-t border-slate-100">
          <h5 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">2. Tentang Saya</h5>
          <textarea v-model="cvData.aboutMe" rows="5" class="form-input"></textarea>
        </section>

        <!-- 3. Pendidikan -->
        <section class="pt-5 border-t border-slate-100 space-y-4">
          <h5 class="text-xs font-bold uppercase tracking-wider text-slate-500">3. Pendidikan</h5>
          <div>
            <label class="form-label">Baris Judul Pendidikan</label>
            <input v-model="cvData.educationHeader" type="text" class="form-input" />
          </div>
          <div>
            <label class="form-label">Deskripsi Pendidikan</label>
            <textarea v-model="cvData.educationDesc" rows="3" class="form-input"></textarea>
          </div>
        </section>

        <!-- 4. Daftar Project / Pengalaman -->
        <section class="pt-5 border-t border-slate-100 space-y-4">
          <div class="flex items-center justify-between gap-3">
            <h5 class="text-xs font-bold uppercase tracking-wider text-slate-500">4. Pengalaman (Proyek)</h5>
            <button @click="addProject" class="btn-soft btn-sm">
              <Plus class="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </div>

          <!-- Quick import from Supabase portfolios -->
          <div v-if="profileStore.portfolios.length > 0" class="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p class="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
              <Layers class="w-3.5 h-3.5 text-indigo-600" />
              <span>Tambah cepat dari portofolio:</span>
            </p>
            <div class="flex gap-2 overflow-x-auto hide-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
              <button
                v-for="p in profileStore.portfolios"
                :key="p.id"
                @click="importFromPortfolio(p)"
                class="chip chip-idle max-w-[220px]"
                title="Tambahkan ke daftar proyek CV"
              >
                <Plus class="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span class="truncate">{{ p.title }}</span>
              </button>
            </div>
          </div>

          <!-- Project Items List -->
          <div class="space-y-3">
            <div
              v-for="(proj, idx) in cvData.projects"
              :key="proj.id || idx"
              class="p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
            >
              <div class="flex items-center justify-between gap-2 -my-1">
                <span class="text-xs font-bold text-slate-500">Proyek #{{ idx + 1 }}</span>
                <button
                  @click="removeProject(idx)"
                  class="btn-icon-danger w-10 h-10"
                  title="Hapus proyek ini"
                  aria-label="Hapus proyek ini"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
              <div>
                <label class="form-label">Nama Proyek</label>
                <input
                  v-model="proj.title"
                  type="text"
                  placeholder="Contoh: Prediksi IHSG Menggunakan Python"
                  class="form-input font-semibold"
                />
              </div>
              <div>
                <label class="form-label">Deskripsi Singkat</label>
                <textarea
                  v-model="proj.description"
                  rows="3"
                  placeholder="Jelaskan peran dan hasil yang dicapai..."
                  class="form-input"
                ></textarea>
              </div>
            </div>
          </div>
        </section>

        <!-- 5. Reference -->
        <section class="pt-5 border-t border-slate-100">
          <h5 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">5. Referensi</h5>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="form-label">Nama Referensi</label>
              <input v-model="cvData.reference.name" type="text" class="form-input" />
            </div>
            <div>
              <label class="form-label">Jabatan & Instansi</label>
              <input v-model="cvData.reference.position" type="text" class="form-input" />
            </div>
            <div>
              <label class="form-label">No. Telepon</label>
              <input v-model="cvData.reference.phone" type="tel" inputmode="tel" class="form-input" />
            </div>
          </div>
        </section>

        <!-- Bottom Save Button -->
        <div class="pt-1 flex sm:justify-end">
          <button @click="handleSave" class="btn-primary w-full sm:w-auto">
            <Save class="w-4 h-4" />
            <span>Simpan Semua Perubahan</span>
          </button>
        </div>
      </div>

      <!-- THE PAPER CV DOCUMENT — diskalakan agar pas layar -->
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
          id="cv-document-paper"
          ref="paperRef"
          class="w-[794px] bg-white text-black p-14 shadow-lg border border-slate-200 font-serif leading-relaxed text-sm selection:bg-slate-200"
          style="min-height: 1120px;"
          :style="paperInnerStyle"
        >
        <!-- Header (Name Left, Contacts Right with Clean Circular Icons) -->
        <div class="flex flex-row items-start justify-between gap-4 pb-4">
          <!-- Left: Big Bold Name -->
          <div>
            <h1 class="text-4xl font-bold tracking-tight text-black font-serif">
              {{ cvData.fullName }}
            </h1>
          </div>

          <!-- Right: Contact Info with Icons -->
          <div class="flex flex-col items-end text-sm text-black space-y-1 font-sans">
            <!-- Phone -->
            <div v-if="cvData.phone" class="inline-flex items-center gap-2">
              <span class="w-4 h-4 rounded-full border border-black flex items-center justify-center flex-shrink-0">
                <Phone class="w-2.5 h-2.5 text-black" />
              </span>
              <span>{{ cvData.phone }}</span>
            </div>

            <!-- Email -->
            <div v-if="cvData.email" class="inline-flex items-center gap-2">
              <Mail class="w-3.5 h-3.5 text-black flex-shrink-0" />
              <span>{{ cvData.email }}</span>
            </div>

            <!-- Location -->
            <div v-if="cvData.location" class="inline-flex items-center gap-2">
              <MapPin class="w-3.5 h-3.5 text-black flex-shrink-0" />
              <span>{{ cvData.location }}</span>
            </div>
          </div>
        </div>

        <!-- Section 1: Tentang Saya -->
        <div class="mt-4 mb-6">
          <h2 class="text-lg font-bold text-black font-serif">
            Tentang Saya
          </h2>
          <div class="border-b-2 border-black mt-1 mb-3"></div>
          <p class="text-[13px] leading-relaxed text-black text-justify font-serif">
            {{ cvData.aboutMe }}
          </p>
        </div>

        <!-- Section 2: Pendidikan -->
        <div class="mb-6">
          <h2 class="text-lg font-bold text-black font-serif">
            Pendidikan
          </h2>
          <div class="border-b-2 border-black mt-1 mb-3"></div>
          <div>
            <h3 class="font-bold text-sm text-black font-serif">
              {{ cvData.educationHeader }}
            </h3>
            <p v-if="cvData.educationDesc" class="text-[13px] leading-relaxed text-black mt-1 text-justify font-serif">
              {{ cvData.educationDesc }}
            </p>
          </div>
        </div>

        <!-- Section 3: Pengalaman (Bullet Projects) -->
        <div class="mb-6">
          <h2 class="text-lg font-bold text-black font-serif">
            Pengalaman
          </h2>
          <div class="border-b-2 border-black mt-1 mb-4"></div>
          
          <div class="space-y-4">
            <div 
              v-for="item in cvData.projects" 
              :key="item.id"
              class="flex items-start gap-3"
            >
              <!-- Solid black round bullet -->
              <span class="w-2.5 h-2.5 rounded-full bg-black flex-shrink-0 mt-1"></span>
              
              <div class="flex-1">
                <h3 class="font-bold text-sm text-black font-serif leading-snug">
                  Project — {{ item.title }}
                </h3>
                <p class="text-[13px] leading-relaxed text-black mt-1 text-justify font-serif">
                  {{ item.description }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 4: Reference -->
        <div v-if="cvData.reference && cvData.reference.name" class="mb-4">
          <h2 class="text-lg font-bold text-black font-serif">
            Reference
          </h2>
          <div class="border-b-2 border-black mt-1 mb-3"></div>
          
          <div class="space-y-0.5">
            <h3 class="font-bold text-sm text-black font-serif">
              {{ cvData.reference.name }}
            </h3>
            <p class="text-[13px] text-black font-serif">
              {{ cvData.reference.position }}
            </p>
            <div v-if="cvData.reference.phone" class="inline-flex items-center gap-1.5 pt-1 text-[13px] text-black font-sans">
              <span class="w-4 h-4 rounded-full border border-black flex items-center justify-center flex-shrink-0">
                <Phone class="w-2.5 h-2.5 text-black" />
              </span>
              <span>{{ cvData.reference.phone }}</span>
            </div>
          </div>
        </div>

      </div>
      </div> <!-- End of paper wrapper -->

    </div>
  </div>
</template>
