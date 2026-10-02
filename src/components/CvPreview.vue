<script setup>
import { ref, watch } from 'vue'
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
  Save
} from 'lucide-vue-next'
import { exportElementToPdf } from '../services/pdfExport'
import { useProfileStore } from '../stores/profile'

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

// Local editable state initialized from props & store or user's exact CV
const cvData = ref({
  fullName: props.profile.fullName || 'Agung Setyawan',
  phone: props.profile.phone || '+62 821-3549-0941',
  email: props.profile.email || 'aggungset04@gmail.com',
  location: props.profile.location || 'Kleteran , Grabag , Magelang',
  aboutMe: props.tailoredSummary || props.profile.bio || 'Saya Agung Setyawan, mahasiswa akhir Teknik Informatika dengan ketertarikan kuat pada tiga bidang utama, yaitu pengembangan web, jaringan komputer, dan pengolahan data menggunakan Python. Selain itu, saya juga memiliki kemampuan dalam maintenance PC serta perangkat IT lainnya.',
  
  // Pendidikan
  educationHeader: '2019 - 2022 | SMAN 1 Grabag| Jurusan Ilmu Pengetahuan Sosial',
  educationDesc: 'Jurusan IPS membekali siswa dengan dasar sosial, ekonomi, dan manajemen, serta mengembangkan kemampuan analisis, logika berpikir, dan komunikasi yang mendukung karier di bidang teknologi informasi.',
  
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
    aboutMe: 'Saya Agung Setyawan, mahasiswa akhir Teknik Informatika dengan ketertarikan kuat pada tiga bidang utama, yaitu pengembangan web, jaringan komputer, dan pengolahan data menggunakan Python. Selain itu, saya juga memiliki kemampuan dalam maintenance PC serta perangkat IT lainnya.',
    educationHeader: '2019 - 2022 | SMAN 1 Grabag| Jurusan Ilmu Pengetahuan Sosial',
    educationDesc: 'Jurusan IPS membekali siswa dengan dasar sosial, ekonomi, dan manajemen, serta mengembangkan kemampuan analisis, logika berpikir, dan komunikasi yang mendukung karier di bidang teknologi informasi.',
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

// Load saved custom CV on mount if exists
const savedCv = localStorage.getItem('autoapply_custom_cv')
if (savedCv) {
  try {
    const parsed = JSON.parse(savedCv)
    cvData.value = { ...cvData.value, ...parsed }
  } catch (e) {
    console.warn('Could not parse saved custom CV:', e)
  }
}

async function handleDownloadPdf() {
  try {
    isExporting.value = true
    const filename = `CV_${(cvData.value.fullName || 'Pelamar').replace(/\s+/g, '_')}.pdf`
    await exportElementToPdf('cv-document-paper', filename)
  } catch (err) {
    alert('Gagal mendownload PDF CV: ' + err.message)
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
        <span class="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
        <h3 class="font-semibold text-xs sm:text-sm text-slate-800">Format CV Standar Profesional</h3>
        <span class="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 hidden sm:inline">
          Format Bersih Sesuai Template
        </span>
      </div>
      
      <div class="flex items-center gap-2">
        <!-- Edit Toggle Button -->
        <button
          @click="isEditing = !isEditing"
          class="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-xs"
          :class="isEditing 
            ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'"
        >
          <component :is="isEditing ? Eye : Edit3" class="w-3.5 h-3.5" />
          <span>{{ isEditing ? 'Lihat Pratinjau' : 'Edit Nomor, Gmail & Proyek' }}</span>
        </button>

        <!-- Reset Button -->
        <button
          @click="resetToImageSample"
          class="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-200 bg-white border border-slate-300 transition-colors shadow-xs"
          title="Reset ke data contoh CV"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span class="hidden md:inline">Reset Default</span>
        </button>

        <!-- Export PDF Button -->
        <button
          @click="handleDownloadPdf"
          :disabled="isExporting"
          class="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-black text-white transition-colors shadow-xs disabled:opacity-50"
        >
          <Download class="w-3.5 h-3.5" />
          <span>{{ isExporting ? 'Membuat PDF...' : 'Download PDF CV' }}</span>
        </button>
      </div>
    </div>

    <!-- Notification Bar -->
    <div v-if="saveNotice" class="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs text-emerald-800 flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <Check class="w-4 h-4 text-emerald-600" />
        <span class="font-medium">Perubahan CV berhasil disimpan!</span>
      </div>
      <span class="text-[11px] text-emerald-600">Otomatis sinkron ke profil</span>
    </div>

    <!-- Content Area: Split View when Editing, or Single Clean Paper when Previewing -->
    <div class="overflow-y-auto flex-1 bg-slate-100/70 p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      
      <!-- EDIT PANEL (Visible when isEditing is true) -->
      <div v-if="isEditing" class="w-full max-w-3xl mb-8 bg-white p-6 rounded-xl border border-slate-300 shadow-sm space-y-6">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center space-x-2">
            <Edit3 class="w-4 h-4 text-indigo-600" />
            <h4 class="font-bold text-sm text-slate-900">Formulir Edit Data CV</h4>
          </div>
          <button
            @click="handleSave"
            class="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <Save class="w-3.5 h-3.5" />
            <span>Simpan Perubahan</span>
          </button>
        </div>

        <!-- 1. Kontak & Identitas -->
        <div>
          <h5 class="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">1. Identitas & Kontak Header</h5>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Nama Lengkap</label>
              <input
                v-model="cvData.fullName"
                type="text"
                class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Nomor Telepon / WhatsApp</label>
              <input
                v-model="cvData.phone"
                type="text"
                class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Email (Gmail)</label>
              <input
                v-model="cvData.email"
                type="email"
                class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Alamat / Domisili</label>
              <input
                v-model="cvData.location"
                type="text"
                class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        <!-- 2. Tentang Saya -->
        <div class="pt-4 border-t border-slate-100">
          <h5 class="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">2. Bagian "Tentang Saya"</h5>
          <textarea
            v-model="cvData.aboutMe"
            rows="3"
            class="w-full p-3 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
          ></textarea>
        </div>

        <!-- 3. Pendidikan -->
        <div class="pt-4 border-t border-slate-100 space-y-3">
          <h5 class="text-xs font-bold uppercase tracking-wider text-slate-700">3. Bagian "Pendidikan"</h5>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Baris Judul Pendidikan</label>
            <input
              v-model="cvData.educationHeader"
              type="text"
              class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Deskripsi Pendidikan</label>
            <textarea
              v-model="cvData.educationDesc"
              rows="2"
              class="w-full p-3 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
            ></textarea>
          </div>
        </div>

        <!-- 4. Daftar Project / Pengalaman -->
        <div class="pt-4 border-t border-slate-100 space-y-3">
          <div class="flex items-center justify-between">
            <h5 class="text-xs font-bold uppercase tracking-wider text-slate-700">4. Bagian "Pengalaman" (Daftar Proyek)</h5>
            <button
              @click="addProject"
              class="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>Tambah Proyek</span>
            </button>
          </div>

          <!-- Quick import from Supabase portfolios -->
          <div v-if="profileStore.portfolios.length > 0" class="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p class="text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
              <Layers class="w-3 h-3 text-indigo-600" />
              <span>Tersedia di Supabase (Klik untuk tambahkan langsung ke CV):</span>
            </p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="p in profileStore.portfolios"
                :key="p.id"
                @click="importFromPortfolio(p)"
                class="text-[11px] px-2.5 py-1 bg-white hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 border border-slate-200 rounded-md transition-colors shadow-xs flex items-center gap-1"
                title="Klik untuk menambahkan ke daftar proyek CV"
              >
                <Plus class="w-3 h-3 text-indigo-600" />
                <span>{{ p.title }}</span>
              </button>
            </div>
          </div>

          <!-- Project Items List -->
          <div class="space-y-3">
            <div 
              v-for="(proj, idx) in cvData.projects" 
              :key="proj.id || idx"
              class="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2 relative group"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-bold text-slate-500">Proyek #{{ idx + 1 }}</span>
                <button
                  @click="removeProject(idx)"
                  class="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50"
                  title="Hapus proyek ini"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label class="block text-[11px] text-slate-500 mb-0.5">Nama Proyek</label>
                <input
                  v-model="proj.title"
                  type="text"
                  placeholder="Contoh: Prediksi IHSG Menggunakan Python"
                  class="w-full px-3 py-1.5 text-xs rounded border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-800"
                />
              </div>

              <div>
                <label class="block text-[11px] text-slate-500 mb-0.5">Deskripsi Singkat</label>
                <textarea
                  v-model="proj.description"
                  rows="2"
                  placeholder="Jelaskan peran dan hasil yang dicapai..."
                  class="w-full p-2 text-xs rounded border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed text-slate-700"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- 5. Reference -->
        <div class="pt-4 border-t border-slate-100">
          <h5 class="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">5. Bagian "Reference"</h5>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Nama Referensi</label>
              <input
                v-model="cvData.reference.name"
                type="text"
                class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">Jabatan & Instansi</label>
              <input
                v-model="cvData.reference.position"
                type="text"
                class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600 mb-1">No. Telepon</label>
              <input
                v-model="cvData.reference.phone"
                type="text"
                class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        <!-- Bottom Save Button -->
        <div class="pt-3 flex justify-end">
          <button
            @click="handleSave"
            class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            Terapkan & Simpan Semua Perubahan
          </button>
        </div>
      </div>

      <!-- THE PAPER CV DOCUMENT (Pixel-Perfect Clean Layout from Image) -->
      <div class="w-full max-w-full overflow-x-auto flex lg:justify-center rounded-xl pb-6 custom-scrollbar">
        <div
          id="cv-document-paper"
          class="w-[794px] min-w-[794px] shrink-0 bg-white text-black p-10 sm:p-14 shadow-lg border border-slate-200 font-serif leading-relaxed text-sm selection:bg-slate-200 mx-auto"
          style="min-height: 1120px;"
        >
        <!-- Header (Name Left, Contacts Right with Clean Circular Icons) -->
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4">
          <!-- Left: Big Bold Name -->
          <div>
            <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-black font-serif">
              {{ cvData.fullName }}
            </h1>
          </div>

          <!-- Right: Contact Info with Icons -->
          <div class="flex flex-col sm:items-end text-xs sm:text-sm text-black space-y-1 font-sans">
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
          <h2 class="text-base sm:text-lg font-bold text-black font-serif">
            Tentang Saya
          </h2>
          <div class="border-b-2 border-black mt-1 mb-3"></div>
          <p class="text-xs sm:text-[13px] leading-relaxed text-black text-justify font-serif">
            {{ cvData.aboutMe }}
          </p>
        </div>

        <!-- Section 2: Pendidikan -->
        <div class="mb-6">
          <h2 class="text-base sm:text-lg font-bold text-black font-serif">
            Pendidikan
          </h2>
          <div class="border-b-2 border-black mt-1 mb-3"></div>
          <div>
            <h3 class="font-bold text-xs sm:text-sm text-black font-serif">
              {{ cvData.educationHeader }}
            </h3>
            <p v-if="cvData.educationDesc" class="text-xs sm:text-[13px] leading-relaxed text-black mt-1 text-justify font-serif">
              {{ cvData.educationDesc }}
            </p>
          </div>
        </div>

        <!-- Section 3: Pengalaman (Bullet Projects) -->
        <div class="mb-6">
          <h2 class="text-base sm:text-lg font-bold text-black font-serif">
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
                <h3 class="font-bold text-xs sm:text-sm text-black font-serif leading-snug">
                  Project — {{ item.title }}
                </h3>
                <p class="text-xs sm:text-[13px] leading-relaxed text-black mt-1 text-justify font-serif">
                  {{ item.description }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 4: Reference -->
        <div v-if="cvData.reference && cvData.reference.name" class="mb-4">
          <h2 class="text-base sm:text-lg font-bold text-black font-serif">
            Reference
          </h2>
          <div class="border-b-2 border-black mt-1 mb-3"></div>
          
          <div class="space-y-0.5">
            <h3 class="font-bold text-xs sm:text-sm text-black font-serif">
              {{ cvData.reference.name }}
            </h3>
            <p class="text-xs sm:text-[13px] text-black font-serif">
              {{ cvData.reference.position }}
            </p>
            <div v-if="cvData.reference.phone" class="inline-flex items-center gap-1.5 pt-1 text-xs sm:text-[13px] text-black font-sans">
              <span class="w-4 h-4 rounded-full border border-black flex items-center justify-center flex-shrink-0">
                <Phone class="w-2.5 h-2.5 text-black" />
              </span>
              <span>{{ cvData.reference.phone }}</span>
            </div>
          </div>
        </div>

      </div>
      </div> <!-- End of scroll wrapper -->

    </div>
  </div>
</template>
