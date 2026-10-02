<script setup>
import { ref } from 'vue'
import { useProfileStore } from '../stores/profile'
import { useSettingsStore } from '../stores/settings'
import { 
  User, 
  FileText, 
  Briefcase, 
  GraduationCap, 
  Sparkles, 
  Layers, 
  Plus, 
  Trash2, 
  Save, 
  RotateCcw, 
  Database, 
  Check, 
  ExternalLink,
  Download,
  RefreshCw,
  Info
} from 'lucide-vue-next'

const profileStore = useProfileStore()
const settingsStore = useSettingsStore()

const activeSection = ref('portfolio') // default to 'portfolio' so user sees the 4 Supabase projects immediately
const savedNotification = ref(false)
const syncNotification = ref('')

// Experience modal/form
const showAddExp = ref(false)
const newExp = ref({
  company: '',
  role: '',
  location: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  description: '',
  highlights: []
})
const newExpHighlight = ref('')

// Education form
const showAddEdu = ref(false)
const newEdu = ref({
  institution: '',
  degree: '',
  major: '',
  year: '',
  gpa: ''
})

// Skill form
const showAddSkill = ref(false)
const newSkill = ref({
  name: '',
  category: 'Frontend',
  level: 'Advanced',
  isHighlighted: true
})

// Portfolio form
const showAddPort = ref(false)
const newPort = ref({
  title: '',
  category: '',
  description: '',
  technologiesText: '',
  demoUrl: '',
  repoUrl: '',
  imageUrl: ''
})

function triggerSave() {
  profileStore.persist()
  savedNotification.value = true
  setTimeout(() => {
    savedNotification.value = false
  }, 2500)
}

async function handleSyncSupabase() {
  try {
    const res = await profileStore.syncToSupabase()
    syncNotification.value = res.message
    setTimeout(() => {
      syncNotification.value = ''
    }, 4000)
  } catch (err) {
    alert('Gagal sync ke Supabase: ' + err.message)
  }
}

async function handleFetchSupabase() {
  try {
    const res = await profileStore.fetchFromSupabase()
    syncNotification.value = res.message
    setTimeout(() => {
      syncNotification.value = ''
    }, 4000)
  } catch (err) {
    alert('Gagal memuat dari Supabase: ' + err.message)
  }
}

function handleAddExp() {
  if (!newExp.value.company || !newExp.value.role) return
  profileStore.addExperience({ ...newExp.value })
  newExp.value = { company: '', role: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '', highlights: [] }
  showAddExp.value = false
  triggerSave()
}

function addExpHighlight() {
  if (newExpHighlight.value.trim()) {
    newExp.value.highlights.push(newExpHighlight.value.trim())
    newExpHighlight.value = ''
  }
}

function handleAddEdu() {
  if (!newEdu.value.institution) return
  profileStore.addEducation({ ...newEdu.value })
  newEdu.value = { institution: '', degree: '', major: '', year: '', gpa: '' }
  showAddEdu.value = false
  triggerSave()
}

function handleAddSkill() {
  if (!newSkill.value.name) return
  profileStore.addSkill({ ...newSkill.value })
  newSkill.value = { name: '', category: 'Frontend', level: 'Advanced', isHighlighted: true }
  showAddSkill.value = false
  triggerSave()
}

function handleAddPort() {
  if (!newPort.value.title) return
  const techArray = newPort.value.technologiesText
    ? newPort.value.technologiesText.split(',').map(s => s.trim()).filter(Boolean)
    : []

  profileStore.addPortfolio({
    ...newPort.value,
    technologies: techArray
  })
  newPort.value = { title: '', category: '', description: '', technologiesText: '', demoUrl: '', repoUrl: '', imageUrl: '' }
  showAddPort.value = false
  triggerSave()
}

function handleResetDefaults() {
  if (confirm('Apakah Anda yakin ingin mereset seluruh template dan data ke default?')) {
    profileStore.resetToDefaults()
    triggerSave()
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
      <div>
        <div class="flex items-center space-x-2">
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
            CV, Portofolio & Master Data
          </h1>
          <span 
            v-if="settingsStore.hasSupabase"
            class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"
          >
            <Database class="w-3 h-3 text-emerald-600" />
            <span>Supabase Cloud</span>
          </span>
        </div>
        <p class="text-sm text-slate-500 mt-1">
          Kelola portofolio proyek, data profil, pengalaman, dan template surat lamaran untuk AI.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <!-- TOMBOL TARIK DATA DARI SUPABASE -->
        <button
          v-if="settingsStore.hasSupabase"
          @click="handleFetchSupabase"
          :disabled="profileStore.isFetchingSupabase"
          class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors shadow-xs"
          title="Tarik portofolio & data terbaru dari Supabase"
        >
          <RefreshCw class="w-3.5 h-3.5 text-indigo-600" :class="{ 'animate-spin': profileStore.isFetchingSupabase }" />
          <span>{{ profileStore.isFetchingSupabase ? 'Memuat...' : 'Muat dari Supabase' }}</span>
        </button>

        <!-- SYNC KE SUPABASE -->
        <button
          v-if="settingsStore.hasSupabase"
          @click="handleSyncSupabase"
          :disabled="profileStore.isSyncing"
          class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 transition-colors shadow-xs"
          title="Simpan profil ke tabel profiles di Supabase"
        >
          <Database class="w-3.5 h-3.5 text-indigo-600" />
          <span>{{ profileStore.isSyncing ? 'Menyimpan...' : 'Kirim Profil ke Supabase' }}</span>
        </button>

        <!-- RESET DEFAULT -->
        <button
          @click="handleResetDefaults"
          class="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Reset ke data awal"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        <!-- SIMPAN PERUBAHAN -->
        <button
          @click="triggerSave"
          class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all"
        >
          <Save class="w-3.5 h-3.5" />
          <span>Simpan Perubahan</span>
        </button>
      </div>
    </div>

    <!-- Alert Notifications -->
    <div v-if="savedNotification" class="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
      <Check class="w-4 h-4 text-emerald-600 flex-shrink-0" />
      <span class="font-medium">Data berhasil disimpan!</span>
    </div>
    <div v-if="syncNotification" class="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs flex items-center gap-2">
      <Check class="w-4 h-4 text-indigo-600 flex-shrink-0" />
      <span class="font-medium">{{ syncNotification }}</span>
    </div>

    <!-- Navigation Tabs / Pills -->
    <div class="flex flex-wrap gap-2 pb-1">
      <button
        @click="activeSection = 'portfolio'"
        class="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
        :class="activeSection === 'portfolio' 
          ? 'bg-indigo-600 text-white shadow-xs' 
          : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'"
      >
        <Layers class="w-3.5 h-3.5" />
        <span>Portofolio Proyek ({{ profileStore.portfolios.length }})</span>
      </button>

      <button
        @click="activeSection = 'profile'"
        class="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
        :class="activeSection === 'profile' 
          ? 'bg-indigo-600 text-white shadow-xs' 
          : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'"
      >
        <User class="w-3.5 h-3.5" />
        <span>Data Diri & Kontak</span>
      </button>

      <button
        @click="activeSection = 'template'"
        class="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
        :class="activeSection === 'template' 
          ? 'bg-indigo-600 text-white shadow-xs' 
          : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'"
      >
        <FileText class="w-3.5 h-3.5" />
        <span>Template Surat Lamaran</span>
      </button>

      <button
        @click="activeSection = 'experience'"
        class="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
        :class="activeSection === 'experience' 
          ? 'bg-indigo-600 text-white shadow-xs' 
          : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'"
      >
        <Briefcase class="w-3.5 h-3.5" />
        <span>Pengalaman Kerja ({{ profileStore.experiences.length }})</span>
      </button>

      <button
        @click="activeSection = 'education'"
        class="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
        :class="activeSection === 'education' 
          ? 'bg-indigo-600 text-white shadow-xs' 
          : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'"
      >
        <GraduationCap class="w-3.5 h-3.5" />
        <span>Pendidikan ({{ profileStore.educations.length }})</span>
      </button>

      <button
        @click="activeSection = 'skills'"
        class="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
        :class="activeSection === 'skills' 
          ? 'bg-indigo-600 text-white shadow-xs' 
          : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'"
      >
        <Sparkles class="w-3.5 h-3.5" />
        <span>Keahlian & Skill ({{ profileStore.skills.length }})</span>
      </button>
    </div>

    <!-- SECTION 1: PORTOFOLIO PROYEK (Primary Focus) -->
    <div v-if="activeSection === 'portfolio'" class="clean-card p-6 sm:p-7 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers class="w-4 h-4 text-indigo-600" />
            <span>Koleksi Portofolio Proyek</span>
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Daftar proyek yang dapat dipilih saat melamar pekerjaan. Data tersimpan di Supabase.
          </p>
        </div>
        <button
          @click="showAddPort = !showAddPort"
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus class="w-4 h-4" />
          <span>Tambah Portofolio</span>
        </button>
      </div>

      <!-- Add Port Form -->
      <div v-if="showAddPort" class="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700">Form Portofolio Baru</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Judul Proyek *</label>
            <input
              v-model="newPort.title"
              type="text"
              placeholder="Contoh: Sistem Invoice"
              class="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Kategori</label>
            <input
              v-model="newPort.category"
              type="text"
              placeholder="Contoh: Web Application / Attendance System"
              class="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-medium text-slate-600 mb-1">Teknologi Digunakan (pisahkan dengan koma)</label>
            <input
              v-model="newPort.technologiesText"
              type="text"
              placeholder="Contoh: PHP, CodeIgniter, MySQL, Bootstrap"
              class="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Live Demo URL (Opsional)</label>
            <input
              v-model="newPort.demoUrl"
              type="url"
              placeholder="https://..."
              class="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Repository Git URL (Opsional)</label>
            <input
              v-model="newPort.repoUrl"
              type="url"
              placeholder="https://github.com/..."
              class="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Deskripsi Proyek</label>
          <textarea
            v-model="newPort.description"
            rows="3"
            placeholder="Jelaskan tujuan dan fungsi sistem yang Anda buat..."
            class="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          ></textarea>
        </div>
        <div class="flex justify-end gap-2">
          <button @click="showAddPort = false" class="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg">Batal</button>
          <button @click="handleAddPort" class="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg">Simpan Proyek</button>
        </div>
      </div>

      <!-- Portfolio Cards Grid -->
      <div v-if="profileStore.portfolios.length === 0" class="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
        <Layers class="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p class="text-sm font-semibold text-slate-700">Belum ada portofolio</p>
        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Klik tombol "Muat dari Supabase" di atas atau klik "Tambah Portofolio".
        </p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="port in profileStore.portfolios"
          :key="port.id"
          class="p-5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
        >
          <div>
            <div class="flex items-start justify-between gap-2">
              <div>
                <span class="inline-block text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 mb-1.5">
                  {{ port.category || 'Web Application' }}
                </span>
                <h4 class="font-bold text-slate-900 text-sm leading-snug">{{ port.title }}</h4>
              </div>
              <button
                @click="profileStore.deletePortfolio(port.id)"
                class="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                title="Hapus portofolio"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>

            <p class="text-xs text-slate-600 mt-2.5 line-clamp-3 leading-relaxed">
              {{ port.description || 'Tidak ada deskripsi rinci.' }}
            </p>

            <!-- Tech Badges -->
            <div class="flex flex-wrap gap-1.5 mt-3">
              <span
                v-for="(t, i) in port.technologies"
                :key="i"
                class="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200/80"
              >
                {{ t }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-3 pt-3 border-t border-slate-100 text-xs">
            <a 
              v-if="port.demoUrl" 
              :href="port.demoUrl" 
              target="_blank" 
              class="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <ExternalLink class="w-3 h-3" /> Live Demo
            </a>
            <a 
              v-if="port.repoUrl" 
              :href="port.repoUrl" 
              target="_blank" 
              class="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
            >
              <ExternalLink class="w-3 h-3" /> GitHub
            </a>
            <span v-if="!port.demoUrl && !port.repoUrl" class="text-slate-400 text-[11px]">
              Tersimpan untuk lampiran lamaran
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- SECTION 2: DATA DIRI (Profile) -->
    <div v-if="activeSection === 'profile'" class="clean-card p-6 sm:p-7 space-y-6">
      <div class="border-b border-slate-100 pb-3">
        <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
          <User class="w-4 h-4 text-indigo-600" />
          <span>Informasi Pribadi & Kontak Pelamar</span>
        </h2>
        <p class="text-xs text-slate-500 mt-0.5">Informasi ini otomatis dimasukkan ke header CV dan penutup surat lamaran.</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">Nama Lengkap</label>
          <input
            v-model="profileStore.profile.fullName"
            type="text"
            class="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">Headline / Posisi Profesional</label>
          <input
            v-model="profileStore.profile.headline"
            type="text"
            class="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">Email Pribadi</label>
          <input
            v-model="profileStore.profile.email"
            type="email"
            class="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">Nomor Telepon / WhatsApp</label>
          <input
            v-model="profileStore.profile.phone"
            type="text"
            class="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">Kota Domisili</label>
          <input
            v-model="profileStore.profile.location"
            type="text"
            class="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">URL Portfolio Website</label>
          <input
            v-model="profileStore.profile.portfolioUrl"
            type="url"
            class="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">LinkedIn Profile URL</label>
          <input
            v-model="profileStore.profile.linkedin"
            type="url"
            class="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">GitHub Profile URL</label>
          <input
            v-model="profileStore.profile.github"
            type="url"
            class="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1.5">Ringkasan Diri / Bio Singkat (About Me)</label>
        <textarea
          v-model="profileStore.profile.bio"
          rows="4"
          class="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
        ></textarea>
      </div>
    </div>

    <!-- SECTION 3: TEMPLATE SURAT LAMARAN MASTER -->
    <div v-if="activeSection === 'template'" class="clean-card p-6 sm:p-7 space-y-6">
      <div class="border-b border-slate-100 pb-3">
        <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
          <FileText class="w-4 h-4 text-indigo-600" />
          <span>Template Dasar Surat Lamaran (Cover Letter)</span>
        </h2>
        <p class="text-xs text-slate-500 mt-0.5">Template master ini akan dipersonalisasi otomatis oleh AI sesuai lowongan kerja.</p>
      </div>

      <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
        <span class="font-semibold text-slate-800">Variabel Dinamis yang Tersedia:</span>
        <div class="flex flex-wrap gap-2 pt-1 font-mono text-[11px] text-indigo-700">
          <code class="bg-white px-2 py-0.5 rounded border border-slate-200">&#123;&#123;company&#125;&#125;</code>
          <code class="bg-white px-2 py-0.5 rounded border border-slate-200">&#123;&#123;position&#125;&#125;</code>
          <code class="bg-white px-2 py-0.5 rounded border border-slate-200">&#123;&#123;name&#125;&#125;</code>
          <code class="bg-white px-2 py-0.5 rounded border border-slate-200">&#123;&#123;phone&#125;&#125;</code>
          <code class="bg-white px-2 py-0.5 rounded border border-slate-200">&#123;&#123;email&#125;&#125;</code>
          <code class="bg-white px-2 py-0.5 rounded border border-slate-200">&#123;&#123;date&#125;&#125;</code>
        </div>
      </div>

      <textarea
        v-model="profileStore.masterCoverLetter"
        rows="16"
        class="w-full p-4 rounded-xl bg-white border border-slate-300 text-slate-800 text-sm font-mono leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none"
      ></textarea>
    </div>

    <!-- SECTION 4: PENGALAMAN KERJA -->
    <div v-if="activeSection === 'experience'" class="clean-card p-6 sm:p-7 space-y-6">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
            <Briefcase class="w-4 h-4 text-indigo-600" />
            <span>Riwayat Pengalaman Kerja</span>
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">Pengalaman ini akan disinkronkan ke dokumen CV ATS.</p>
        </div>
        <button
          @click="showAddExp = !showAddExp"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Tambah Pengalaman</span>
        </button>
      </div>

      <!-- Add Experience Form -->
      <div v-if="showAddExp" class="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
        <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Tambah Pengalaman Baru</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            v-model="newExp.company"
            type="text"
            placeholder="Nama Perusahaan *"
            class="px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <input
            v-model="newExp.role"
            type="text"
            placeholder="Posisi / Jabatan *"
            class="px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <input
            v-model="newExp.startDate"
            type="text"
            placeholder="Mulai (e.g. Jan 2023)"
            class="px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <input
            v-model="newExp.endDate"
            type="text"
            placeholder="Selesai (e.g. Sekarang)"
            class="px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <textarea
          v-model="newExp.description"
          rows="3"
          placeholder="Deskripsi singkat tanggung jawab dan pencapaian..."
          class="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        ></textarea>
        <div class="flex justify-end gap-2">
          <button @click="showAddExp = false" class="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg">Batal</button>
          <button @click="handleAddExp" class="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg">Simpan</button>
        </div>
      </div>

      <!-- Experience List -->
      <div class="space-y-3">
        <div
          v-for="exp in profileStore.experiences"
          :key="exp.id"
          class="p-4 rounded-xl bg-white border border-slate-200 flex items-start justify-between gap-4"
        >
          <div>
            <div class="flex items-center gap-2">
              <h4 class="font-bold text-slate-900 text-sm">{{ exp.role }}</h4>
              <span class="text-xs text-slate-400">•</span>
              <span class="text-xs font-semibold text-indigo-700">{{ exp.company }}</span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">{{ exp.startDate }} - {{ exp.endDate }} {{ exp.location ? `• ${exp.location}` : '' }}</p>
            <p class="text-xs text-slate-600 mt-2 leading-relaxed">{{ exp.description }}</p>
          </div>
          <button
            @click="profileStore.deleteExperience(exp.id)"
            class="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50"
            title="Hapus pengalaman"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- SECTION 5: PENDIDIKAN -->
    <div v-if="activeSection === 'education'" class="clean-card p-6 sm:p-7 space-y-6">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap class="w-4 h-4 text-indigo-600" />
            <span>Riwayat Pendidikan</span>
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">Informasi pendidikan untuk format CV ATS.</p>
        </div>
        <button
          @click="showAddEdu = !showAddEdu"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Tambah Pendidikan</span>
        </button>
      </div>

      <!-- Add Education Form -->
      <div v-if="showAddEdu" class="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
        <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Tambah Riwayat Pendidikan</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            v-model="newEdu.institution"
            type="text"
            placeholder="Nama Universitas / Sekolah *"
            class="px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <input
            v-model="newEdu.degree"
            type="text"
            placeholder="Gelar (e.g. S1 / D3)"
            class="px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <input
            v-model="newEdu.major"
            type="text"
            placeholder="Jurusan (e.g. Teknik Informatika)"
            class="px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <input
            v-model="newEdu.year"
            type="text"
            placeholder="Tahun Kelulusan (e.g. 2019 - 2023)"
            class="px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button @click="showAddEdu = false" class="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-200">Batal</button>
          <button @click="handleAddEdu" class="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700">Simpan</button>
        </div>
      </div>

      <!-- Education List -->
      <div class="space-y-3">
        <div
          v-for="edu in profileStore.educations"
          :key="edu.id"
          class="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between"
        >
          <div>
            <h4 class="font-bold text-slate-900 text-sm">{{ edu.institution }}</h4>
            <p class="text-xs text-slate-600 mt-0.5">{{ edu.degree }} {{ edu.major ? `• ${edu.major}` : '' }} ({{ edu.year }})</p>
          </div>
          <button
            @click="profileStore.deleteEducation(edu.id)"
            class="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- SECTION 6: KEAHLIAN & SKILL -->
    <div v-if="activeSection === 'skills'" class="clean-card p-6 sm:p-7 space-y-6">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-indigo-600" />
            <span>Keahlian & Kemampuan Teknis</span>
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">Skill yang akan diekstrak dan disesuaikan dengan syarat lowongan kerja.</p>
        </div>
        <button
          @click="showAddSkill = !showAddSkill"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Tambah Skill</span>
        </button>
      </div>

      <!-- Add Skill -->
      <div v-if="showAddSkill" class="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap gap-3 items-center">
        <input
          v-model="newSkill.name"
          type="text"
          placeholder="Nama Skill (e.g. PHP, CodeIgniter, MySQL)"
          class="flex-1 min-w-[200px] px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
        <select
          v-model="newSkill.category"
          class="px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="Backend">Backend</option>
          <option value="Frontend">Frontend</option>
          <option value="Database">Database</option>
          <option value="Tools">Tools</option>
          <option value="UI/UX">UI/UX</option>
        </select>
        <button @click="handleAddSkill" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold">Tambah</button>
        <button @click="showAddSkill = false" class="px-3 py-2 text-slate-600 hover:bg-slate-200 text-xs rounded-lg">Batal</button>
      </div>

      <!-- Skill Badges -->
      <div class="flex flex-wrap gap-2">
        <div
          v-for="sk in profileStore.skills"
          :key="sk.id"
          class="group flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all"
          :class="sk.isHighlighted 
            ? 'bg-indigo-50 border-indigo-200 text-indigo-800' 
            : 'bg-white border-slate-200 text-slate-600'"
        >
          <span
            @click="profileStore.toggleSkillHighlight(sk.id)"
            class="text-xs font-semibold cursor-pointer select-none"
            :title="'Klik untuk highlight'"
          >
            {{ sk.name }}
          </span>
          <button
            @click="profileStore.deleteSkill(sk.id)"
            class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-opacity"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
