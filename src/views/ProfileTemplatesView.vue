<script setup>
import { ref, computed } from 'vue'
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

const sections = computed(() => [
  { key: 'portfolio', label: 'Portofolio', icon: Layers, count: profileStore.portfolios.length },
  { key: 'profile', label: 'Data Diri', icon: User },
  { key: 'template', label: 'Template Surat', icon: FileText },
  { key: 'experience', label: 'Pengalaman', icon: Briefcase, count: profileStore.experiences.length },
  { key: 'education', label: 'Pendidikan', icon: GraduationCap, count: profileStore.educations.length },
  { key: 'skills', label: 'Skill', icon: Sparkles, count: profileStore.skills.length }
])

const activeSectionMeta = computed(() => sections.value.find(sec => sec.key === activeSection.value) || sections.value[0])

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
  <div class="space-y-4 sm:space-y-6 pb-20 lg:pb-0">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 lg:pb-4 lg:border-b lg:border-slate-200">
      <div class="min-w-0">
        <div class="hidden lg:flex items-center gap-2">
          <h1 class="page-title">CV, Portofolio & Master Data</h1>
          <span
            v-if="settingsStore.hasSupabase"
            class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"
          >
            <Database class="w-3 h-3 text-emerald-600" />
            <span>Supabase Cloud</span>
          </span>
        </div>
        <div class="flex items-start justify-between gap-3">
          <p class="page-subtitle !mt-0 lg:!mt-1">
            Kelola portofolio, data profil, pengalaman & template surat untuk AI.
          </p>
          <button
            @click="handleResetDefaults"
            class="lg:hidden btn-ghost btn-sm w-10 px-0 shrink-0 -mt-1 -mr-1"
            title="Reset ke data awal"
            aria-label="Reset ke data awal"
          >
            <RotateCcw class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Aksi sekunder (sinkronisasi) -->
      <div class="items-center gap-2" :class="settingsStore.hasSupabase ? 'flex' : 'hidden lg:flex'">
        <button
          v-if="settingsStore.hasSupabase"
          @click="handleFetchSupabase"
          :disabled="profileStore.isFetchingSupabase"
          class="btn-secondary btn-sm flex-1 lg:flex-none"
          title="Tarik portofolio & data terbaru dari Supabase"
        >
          <RefreshCw class="w-4 h-4 text-indigo-600" :class="{ 'animate-spin': profileStore.isFetchingSupabase }" />
          <span>{{ profileStore.isFetchingSupabase ? 'Memuat...' : 'Muat' }}<span class="hidden sm:inline">{{ profileStore.isFetchingSupabase ? '' : ' dari Supabase' }}</span></span>
        </button>

        <button
          v-if="settingsStore.hasSupabase"
          @click="handleSyncSupabase"
          :disabled="profileStore.isSyncing"
          class="btn-soft btn-sm flex-1 lg:flex-none"
          title="Simpan profil ke tabel profiles di Supabase"
        >
          <Database class="w-4 h-4" />
          <span>{{ profileStore.isSyncing ? 'Mengirim...' : 'Kirim' }}<span class="hidden sm:inline">{{ profileStore.isSyncing ? '' : ' ke Supabase' }}</span></span>
        </button>

        <button
          @click="handleResetDefaults"
          class="hidden lg:inline-flex btn-ghost btn-sm shrink-0"
          title="Reset ke data awal"
        >
          <RotateCcw class="w-4 h-4" />
          <span>Reset</span>
        </button>

        <!-- Simpan (desktop) -->
        <button @click="triggerSave" class="hidden lg:inline-flex btn-primary btn-sm">
          <Save class="w-4 h-4" />
          <span>Simpan Perubahan</span>
        </button>
      </div>
    </div>

    <!-- Toast notifikasi -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="-translate-y-3 opacity-0"
      leave-active-class="transition duration-200 ease-in"
      leave-to-class="-translate-y-3 opacity-0"
    >
      <div v-if="savedNotification" class="toast bg-emerald-600 text-white" role="status">
        <Check class="w-4 h-4 mt-0.5 shrink-0" />
        <span>Data berhasil disimpan!</span>
      </div>
    </transition>
    <div v-if="syncNotification" class="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-[13px] flex items-start gap-2" role="status">
      <Check class="w-4 h-4 mt-0.5 text-indigo-600 shrink-0" />
      <span class="font-medium">{{ syncNotification }}</span>
    </div>

    <!-- Navigasi Seksi: dropdown -->
    <div class="sticky top-14 lg:top-0 z-20 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 py-2 bg-slate-50/95 backdrop-blur-md lg:static lg:bg-transparent lg:backdrop-blur-none lg:py-0">
      <div class="relative w-full sm:max-w-xs">
        <component
          :is="activeSectionMeta.icon"
          class="w-[18px] h-[18px] text-indigo-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        />
        <select
          v-model="activeSection"
          class="form-select pl-11 font-semibold shadow-xs"
          aria-label="Pilih bagian data"
        >
          <option v-for="sec in sections" :key="sec.key" :value="sec.key">
            {{ sec.label }}{{ sec.count !== undefined ? ` (${sec.count})` : '' }}
          </option>
        </select>
      </div>
    </div>

    <!-- SECTION 1: PORTOFOLIO PROYEK -->
    <section v-if="activeSection === 'portfolio'" class="clean-card card-pad space-y-5">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="section-title">
            <Layers class="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Koleksi Portofolio</span>
          </h2>
          <p class="section-desc">Proyek yang dapat dipilih saat melamar. Tersimpan di Supabase.</p>
        </div>
        <button
          @click="showAddPort = !showAddPort"
          class="btn-primary btn-sm shrink-0"
          :aria-expanded="showAddPort"
        >
          <Plus class="w-4 h-4" />
          <span>Tambah</span>
        </button>
      </div>

      <!-- Add Port Form -->
      <div v-if="showAddPort" class="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">Portofolio Baru</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Judul Proyek *</label>
            <input v-model="newPort.title" type="text" placeholder="Contoh: Sistem Invoice" class="form-input" />
          </div>
          <div>
            <label class="form-label">Kategori</label>
            <input v-model="newPort.category" type="text" placeholder="Web Application" class="form-input" />
          </div>
          <div class="sm:col-span-2">
            <label class="form-label">Teknologi <span class="font-normal text-slate-400">(pisahkan dengan koma)</span></label>
            <input v-model="newPort.technologiesText" type="text" placeholder="PHP, CodeIgniter, MySQL" class="form-input" />
          </div>
          <div>
            <label class="form-label">Live Demo URL <span class="font-normal text-slate-400">(opsional)</span></label>
            <input v-model="newPort.demoUrl" type="url" inputmode="url" placeholder="https://..." class="form-input" />
          </div>
          <div>
            <label class="form-label">Repository URL <span class="font-normal text-slate-400">(opsional)</span></label>
            <input v-model="newPort.repoUrl" type="url" inputmode="url" placeholder="https://github.com/..." class="form-input" />
          </div>
        </div>
        <div>
          <label class="form-label">Deskripsi Proyek</label>
          <textarea v-model="newPort.description" rows="4" placeholder="Jelaskan tujuan dan fungsi sistem yang Anda buat..." class="form-input"></textarea>
        </div>
        <div class="grid grid-cols-2 sm:flex sm:justify-end gap-2">
          <button @click="showAddPort = false" class="btn-ghost">Batal</button>
          <button @click="handleAddPort" :disabled="!newPort.title" class="btn-primary">Simpan Proyek</button>
        </div>
      </div>

      <!-- Empty -->
      <div v-if="profileStore.portfolios.length === 0" class="text-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-2xl">
        <Layers class="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p class="text-sm font-semibold text-slate-700">Belum ada portofolio</p>
        <p class="text-[13px] text-slate-500 mt-1 max-w-sm mx-auto">
          Muat dari Supabase atau klik "Tambah" untuk menambahkan proyek.
        </p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <article
          v-for="port in profileStore.portfolios"
          :key="port.id"
          class="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all flex flex-col gap-3"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <span class="inline-block text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 mb-1.5">
                {{ port.category || 'Web Application' }}
              </span>
              <h4 class="font-bold text-slate-900 text-[15px] leading-snug">{{ port.title }}</h4>
            </div>
            <button
              @click="profileStore.deletePortfolio(port.id)"
              class="btn-icon-danger -mr-2 -mt-1"
              title="Hapus portofolio"
              aria-label="Hapus portofolio"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>

          <p class="text-[13px] text-slate-600 line-clamp-3 leading-relaxed">
            {{ port.description || 'Tidak ada deskripsi rinci.' }}
          </p>

          <div v-if="port.technologies?.length" class="flex flex-wrap gap-1.5">
            <span
              v-for="(t, i) in port.technologies"
              :key="i"
              class="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200/80"
            >
              {{ t }}
            </span>
          </div>

          <div class="flex items-center gap-1 pt-2 mt-auto border-t border-slate-100 text-[13px] -mb-1">
            <a
              v-if="port.demoUrl"
              :href="port.demoUrl"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-1.5 min-h-[40px] px-2 -ml-2 rounded-lg text-indigo-600 hover:bg-indigo-50 font-semibold"
            >
              <ExternalLink class="w-4 h-4" /> Live Demo
            </a>
            <a
              v-if="port.repoUrl"
              :href="port.repoUrl"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-1.5 min-h-[40px] px-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
              :class="!port.demoUrl ? '-ml-2' : ''"
            >
              <ExternalLink class="w-4 h-4" /> GitHub
            </a>
            <span v-if="!port.demoUrl && !port.repoUrl" class="text-slate-400 text-xs py-2.5">
              Tersimpan untuk lampiran lamaran
            </span>
          </div>
        </article>
      </div>
    </section>

    <!-- SECTION 2: DATA DIRI -->
    <section v-if="activeSection === 'profile'" class="clean-card card-pad space-y-5">
      <div>
        <h2 class="section-title">
          <User class="w-4 h-4 text-indigo-600 shrink-0" />
          <span>Data Diri & Kontak</span>
        </h2>
        <p class="section-desc">Otomatis dimasukkan ke header CV dan penutup surat lamaran.</p>
      </div>

      <div class="space-y-4">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">Identitas</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="form-label" for="pf-name">Nama Lengkap</label>
            <input id="pf-name" v-model="profileStore.profile.fullName" type="text" autocomplete="name" class="form-input" />
          </div>
          <div>
            <label class="form-label" for="pf-headline">Headline / Posisi Profesional</label>
            <input id="pf-headline" v-model="profileStore.profile.headline" type="text" class="form-input" />
          </div>
          <div>
            <label class="form-label" for="pf-location">Kota Domisili</label>
            <input id="pf-location" v-model="profileStore.profile.location" type="text" autocomplete="address-level2" class="form-input" />
          </div>
          <div>
            <label class="form-label" for="pf-birth">Tempat, Tanggal Lahir (Surat Lamaran)</label>
            <input id="pf-birth" v-model="profileStore.profile.birthPlaceDate" type="text" placeholder="Magelang, 21 April 2001" class="form-input" />
          </div>
        </div>
      </div>

      <div class="space-y-4 pt-5 border-t border-slate-100">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">Kontak</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="form-label" for="pf-email">Email Pribadi</label>
            <input id="pf-email" v-model="profileStore.profile.email" type="email" inputmode="email" autocomplete="email" class="form-input" />
          </div>
          <div>
            <label class="form-label" for="pf-phone">Nomor Telepon / WhatsApp</label>
            <input id="pf-phone" v-model="profileStore.profile.phone" type="tel" inputmode="tel" autocomplete="tel" class="form-input" />
          </div>
        </div>
      </div>

      <div class="space-y-4 pt-5 border-t border-slate-100">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">Tautan</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="form-label" for="pf-web">URL Portfolio Website</label>
            <input id="pf-web" v-model="profileStore.profile.portfolioUrl" type="url" inputmode="url" class="form-input" placeholder="https://" />
          </div>
          <div>
            <label class="form-label" for="pf-li">LinkedIn Profile URL</label>
            <input id="pf-li" v-model="profileStore.profile.linkedin" type="url" inputmode="url" class="form-input" placeholder="https://linkedin.com/in/..." />
          </div>
          <div>
            <label class="form-label" for="pf-gh">GitHub Profile URL</label>
            <input id="pf-gh" v-model="profileStore.profile.github" type="url" inputmode="url" class="form-input" placeholder="https://github.com/..." />
          </div>
        </div>
      </div>

      <div class="pt-5 border-t border-slate-100">
        <label class="form-label" for="pf-bio">Ringkasan Diri / Bio Singkat</label>
        <textarea id="pf-bio" v-model="profileStore.profile.bio" rows="5" class="form-input"></textarea>
      </div>
    </section>

    <!-- SECTION 3: TEMPLATE SURAT LAMARAN -->
    <section v-if="activeSection === 'template'" class="clean-card card-pad space-y-5">
      <div>
        <h2 class="section-title">
          <FileText class="w-4 h-4 text-indigo-600 shrink-0" />
          <span>Template Surat Lamaran</span>
        </h2>
        <p class="section-desc">Template master ini dipersonalisasi otomatis oleh AI sesuai lowongan.</p>
      </div>

      <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
        <span class="font-semibold text-slate-800">Variabel dinamis:</span>
        <div class="flex flex-wrap gap-1.5 font-mono text-[12px] text-indigo-700">
          <code class="bg-white px-2 py-1 rounded-md border border-slate-200">&#123;&#123;company&#125;&#125;</code>
          <code class="bg-white px-2 py-1 rounded-md border border-slate-200">&#123;&#123;position&#125;&#125;</code>
          <code class="bg-white px-2 py-1 rounded-md border border-slate-200">&#123;&#123;name&#125;&#125;</code>
          <code class="bg-white px-2 py-1 rounded-md border border-slate-200">&#123;&#123;phone&#125;&#125;</code>
          <code class="bg-white px-2 py-1 rounded-md border border-slate-200">&#123;&#123;email&#125;&#125;</code>
          <code class="bg-white px-2 py-1 rounded-md border border-slate-200">&#123;&#123;date&#125;&#125;</code>
        </div>
      </div>

      <textarea
        v-model="profileStore.masterCoverLetter"
        rows="16"
        class="form-input font-mono !text-[13px] sm:!text-sm"
        aria-label="Template surat lamaran"
      ></textarea>
    </section>

    <!-- SECTION 4: PENGALAMAN KERJA -->
    <section v-if="activeSection === 'experience'" class="clean-card card-pad space-y-5">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="section-title">
            <Briefcase class="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Pengalaman Kerja</span>
          </h2>
          <p class="section-desc">Disinkronkan ke dokumen CV ATS.</p>
        </div>
        <button @click="showAddExp = !showAddExp" class="btn-primary btn-sm shrink-0" :aria-expanded="showAddExp">
          <Plus class="w-4 h-4" />
          <span>Tambah</span>
        </button>
      </div>

      <div v-if="showAddExp" class="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Pengalaman Baru</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Nama Perusahaan *</label>
            <input v-model="newExp.company" type="text" class="form-input" />
          </div>
          <div>
            <label class="form-label">Posisi / Jabatan *</label>
            <input v-model="newExp.role" type="text" class="form-input" />
          </div>
          <div class="grid grid-cols-2 gap-3 sm:contents">
            <div>
              <label class="form-label">Mulai</label>
              <input v-model="newExp.startDate" type="text" placeholder="Jan 2023" class="form-input" />
            </div>
            <div>
              <label class="form-label">Selesai</label>
              <input v-model="newExp.endDate" type="text" placeholder="Sekarang" class="form-input" />
            </div>
          </div>
        </div>
        <div>
          <label class="form-label">Deskripsi</label>
          <textarea v-model="newExp.description" rows="4" placeholder="Tanggung jawab dan pencapaian..." class="form-input"></textarea>
        </div>
        <div class="grid grid-cols-2 sm:flex sm:justify-end gap-2">
          <button @click="showAddExp = false" class="btn-ghost">Batal</button>
          <button @click="handleAddExp" :disabled="!newExp.company || !newExp.role" class="btn-primary">Simpan</button>
        </div>
      </div>

      <div v-if="profileStore.experiences.length === 0 && !showAddExp" class="text-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-2xl">
        <Briefcase class="w-9 h-9 text-slate-300 mx-auto mb-2" />
        <p class="text-sm font-semibold text-slate-700">Belum ada pengalaman kerja</p>
      </div>

      <ul class="space-y-3">
        <li
          v-for="exp in profileStore.experiences"
          :key="exp.id"
          class="p-4 rounded-2xl bg-white border border-slate-200 flex items-start justify-between gap-3"
        >
          <div class="min-w-0">
            <h4 class="font-bold text-slate-900 text-[15px] leading-snug">{{ exp.role }}</h4>
            <p class="text-[13px] font-semibold text-indigo-700 mt-0.5">{{ exp.company }}</p>
            <p class="text-xs text-slate-500 mt-1">{{ exp.startDate }} – {{ exp.endDate }}{{ exp.location ? ` • ${exp.location}` : '' }}</p>
            <p v-if="exp.description" class="text-[13px] text-slate-600 mt-2 leading-relaxed">{{ exp.description }}</p>
          </div>
          <button
            @click="profileStore.deleteExperience(exp.id)"
            class="btn-icon-danger -mr-2 -mt-1"
            title="Hapus pengalaman"
            aria-label="Hapus pengalaman"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </li>
      </ul>
    </section>

    <!-- SECTION 5: PENDIDIKAN -->
    <section v-if="activeSection === 'education'" class="clean-card card-pad space-y-5">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="section-title">
            <GraduationCap class="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Riwayat Pendidikan</span>
          </h2>
          <p class="section-desc">Informasi pendidikan untuk format CV ATS.</p>
        </div>
        <button @click="showAddEdu = !showAddEdu" class="btn-primary btn-sm shrink-0" :aria-expanded="showAddEdu">
          <Plus class="w-4 h-4" />
          <span>Tambah</span>
        </button>
      </div>

      <div v-if="showAddEdu" class="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Pendidikan Baru</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2">
            <label class="form-label">Universitas / Sekolah *</label>
            <input v-model="newEdu.institution" type="text" class="form-input" />
          </div>
          <div>
            <label class="form-label">Gelar</label>
            <input v-model="newEdu.degree" type="text" placeholder="S1 / D3" class="form-input" />
          </div>
          <div>
            <label class="form-label">Jurusan</label>
            <input v-model="newEdu.major" type="text" placeholder="Teknik Informatika" class="form-input" />
          </div>
          <div>
            <label class="form-label">Tahun</label>
            <input v-model="newEdu.year" type="text" inputmode="numeric" placeholder="2019 - 2023" class="form-input" />
          </div>
        </div>
        <div class="grid grid-cols-2 sm:flex sm:justify-end gap-2">
          <button @click="showAddEdu = false" class="btn-ghost">Batal</button>
          <button @click="handleAddEdu" :disabled="!newEdu.institution" class="btn-primary">Simpan</button>
        </div>
      </div>

      <div v-if="profileStore.educations.length === 0 && !showAddEdu" class="text-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-2xl">
        <GraduationCap class="w-9 h-9 text-slate-300 mx-auto mb-2" />
        <p class="text-sm font-semibold text-slate-700">Belum ada riwayat pendidikan</p>
      </div>

      <ul class="space-y-3">
        <li
          v-for="edu in profileStore.educations"
          :key="edu.id"
          class="p-4 rounded-2xl bg-white border border-slate-200 flex items-start justify-between gap-3"
        >
          <div class="min-w-0">
            <h4 class="font-bold text-slate-900 text-[15px] leading-snug">{{ edu.institution }}</h4>
            <p class="text-[13px] text-slate-600 mt-0.5">{{ edu.degree }}{{ edu.major ? ` • ${edu.major}` : '' }}</p>
            <p v-if="edu.year" class="text-xs text-slate-500 mt-0.5">{{ edu.year }}</p>
          </div>
          <button
            @click="profileStore.deleteEducation(edu.id)"
            class="btn-icon-danger -mr-2 -mt-1"
            title="Hapus pendidikan"
            aria-label="Hapus pendidikan"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </li>
      </ul>
    </section>

    <!-- SECTION 6: KEAHLIAN & SKILL -->
    <section v-if="activeSection === 'skills'" class="clean-card card-pad space-y-5">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="section-title">
            <Sparkles class="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Keahlian & Skill</span>
          </h2>
          <p class="section-desc">Ketuk nama skill untuk menandai sebagai unggulan.</p>
        </div>
        <button @click="showAddSkill = !showAddSkill" class="btn-primary btn-sm shrink-0" :aria-expanded="showAddSkill">
          <Plus class="w-4 h-4" />
          <span>Tambah</span>
        </button>
      </div>

      <div v-if="showAddSkill" class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-3">
          <div>
            <label class="form-label">Nama Skill</label>
            <input v-model="newSkill.name" type="text" placeholder="PHP, MySQL, Vue.js..." class="form-input" @keyup.enter="handleAddSkill" />
          </div>
          <div>
            <label class="form-label">Kategori</label>
            <select v-model="newSkill.category" class="form-select">
              <option value="Backend">Backend</option>
              <option value="Frontend">Frontend</option>
              <option value="Database">Database</option>
              <option value="Tools">Tools</option>
              <option value="UI/UX">UI/UX</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 sm:flex sm:justify-end gap-2">
          <button @click="showAddSkill = false" class="btn-ghost">Batal</button>
          <button @click="handleAddSkill" :disabled="!newSkill.name" class="btn-primary">Tambah Skill</button>
        </div>
      </div>

      <div v-if="profileStore.skills.length === 0 && !showAddSkill" class="text-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-2xl">
        <Sparkles class="w-9 h-9 text-slate-300 mx-auto mb-2" />
        <p class="text-sm font-semibold text-slate-700">Belum ada skill</p>
      </div>

      <div class="flex flex-wrap gap-2">
        <div
          v-for="sk in profileStore.skills"
          :key="sk.id"
          class="group flex items-center rounded-2xl border transition-all max-w-full"
          :class="sk.isHighlighted
            ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
            : 'bg-white border-slate-200 text-slate-600'"
        >
          <button
            @click="profileStore.toggleSkillHighlight(sk.id)"
            class="min-h-[40px] py-2 pl-3.5 pr-1 text-left text-[13px] font-semibold leading-snug select-none"
            :aria-pressed="sk.isHighlighted"
            title="Ketuk untuk highlight"
          >
            {{ sk.name }}
          </button>
          <!-- Selalu terlihat di layar sentuh; muncul saat hover di desktop -->
          <button
            @click="profileStore.deleteSkill(sk.id)"
            class="w-9 h-10 shrink-0 flex items-center justify-center rounded-r-2xl text-slate-400 hover:text-rose-600 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100"
            :aria-label="`Hapus skill ${sk.name}`"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>

    <!-- Mobile sticky save -->
    <div class="mobile-action-bar">
      <div class="max-w-3xl mx-auto">
        <button @click="triggerSave" class="btn-primary w-full">
          <Save class="w-4 h-4" />
          <span>Simpan Perubahan</span>
        </button>
      </div>
    </div>
  </div>
</template>
