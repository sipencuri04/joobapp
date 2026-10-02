import { defineStore } from 'pinia'
import { getSupabaseClient, isSupabaseConfigured } from '../services/supabase'

const DEFAULT_PROFILE = {
  fullName: 'Agung Setyawan',
  headline: 'Mahasiswa Teknik Informatika & Web Developer',
  email: 'aggungset04@gmail.com',
  phone: '+62 821-3549-0941',
  location: 'Kleteran , Grabag , Magelang',
  linkedin: '',
  github: '',
  portfolioUrl: '',
  bio: 'Saya Agung Setyawan, mahasiswa akhir Teknik Informatika dengan ketertarikan kuat pada tiga bidang utama, yaitu pengembangan web, jaringan komputer, dan pengolahan data menggunakan Python. Selain itu, saya juga memiliki kemampuan dalam maintenance PC serta perangkat IT lainnya.'
}

const DEFAULT_EXPERIENCES = [
  {
    id: 'exp-1',
    company: 'Grand Artos Hotel & Convention',
    role: 'IT Support & Systems Implementation',
    location: 'Magelang',
    startDate: '2023',
    endDate: '2024',
    isCurrent: false,
    description: 'Implementasi sistem asset management, helpdesk, dan sistem inventory gudang.',
    highlights: [
      'Membuat sistem manajemen aset perangkat IT (PC, printer, CCTV, UPS)',
      'Membangun sistem helpdesk untuk pelaporan dan percepatan penanganan masalah IT',
      'Mengembangkan sistem inventory gudang untuk perlengkapan operasional hotel'
    ]
  },
  {
    id: 'exp-2',
    company: 'Swalayan',
    role: 'IT Network & Administration Support',
    location: 'Magelang',
    startDate: '2022',
    endDate: '2023',
    isCurrent: false,
    description: 'Melakukan instalasi jaringan komputer dan mendukung sistem administrasi operasional internal swalayan.',
    highlights: [
      'Instalasi dan maintenance jaringan komputer',
      'Mendukung sistem administrasi internal dan kelancaran operasional POS'
    ]
  }
]

const DEFAULT_EDUCATIONS = [
  {
    id: 'edu-1',
    institution: 'SMAN 1 Grabag',
    degree: 'Jurusan Ilmu Pengetahuan Sosial',
    major: 'Ilmu Pengetahuan Sosial (IPS)',
    year: '2019 - 2022',
    gpa: ''
  }
]

const DEFAULT_SKILLS = [
  { id: 'sk-1', name: 'Web Development (PHP, HTML, CSS, JS)', category: 'Frontend/Backend', level: 'Advanced', isHighlighted: true },
  { id: 'sk-2', name: 'Python & Data Processing', category: 'Programming', level: 'Advanced', isHighlighted: true },
  { id: 'sk-3', name: 'Computer Networking & Maintenance', category: 'Infrastructure', level: 'Expert', isHighlighted: true },
  { id: 'sk-4', name: 'Hardware & PC Troubleshooting', category: 'Hardware', level: 'Expert', isHighlighted: true },
  { id: 'sk-5', name: 'MySQL & Database Management', category: 'Database', level: 'Advanced', isHighlighted: true },
  { id: 'sk-6', name: 'CodeIgniter Framework', category: 'Backend', level: 'Advanced', isHighlighted: true },
  { id: 'sk-7', name: 'Sistem Informasi & Asset Management', category: 'Business Systems', level: 'Advanced', isHighlighted: true }
]

const DEFAULT_PORTFOLIOS = [
  {
    id: 'port-cv-1',
    title: 'Prediksi IHSG Menggunakan Python',
    category: 'Data Science & Python',
    description: 'Menganalisis data historis IHSG dengan Python untuk memprediksi pergerakan indeks melalui pengolahan data, analisis tren, dan model prediksi sederhana.',
    technologies: ['Python', 'Pandas', 'Matplotlib', 'Data Analysis'],
    demoUrl: '',
    repoUrl: '',
    imageUrl: '',
    featured: true
  },
  {
    id: 'port-cv-2',
    title: 'Implementasi Jaringan dan Sistem Administrasi Swalayan',
    category: 'Network & System Administration',
    description: 'Melakukan instalasi jaringan komputer, mendukung sistem administrasi internal, serta memberikan dukungan teknis agar operasional swalayan berjalan lancar.',
    technologies: ['Networking', 'LAN/WLAN', 'PC Maintenance', 'Admin Systems'],
    demoUrl: '',
    repoUrl: '',
    imageUrl: '',
    featured: true
  },
  {
    id: 'port-cv-3',
    title: 'Implementasi Sistem Asset dan Helpdesk di Grand Artos Hotel & Convention',
    category: 'Enterprise IT System',
    description: 'Membuat sistem manajemen aset untuk mengelola dan memantau perangkat IT seperti PC, printer, CCTV, dan UPS secara terstruktur, serta membangun sistem help desk untuk pelaporan keluhan dan percepatan penanganan masalah IT.',
    technologies: ['PHP', 'MySQL', 'Web Application', 'Helpdesk API'],
    demoUrl: '',
    repoUrl: '',
    imageUrl: '',
    featured: true
  },
  {
    id: 'port-cv-4',
    title: 'Sistem Inventory Gudang Grand Artos Hotel & Convention',
    category: 'Inventory Management System',
    description: 'Membuat sistem inventory gudang untuk mengelola dan memantau stok perlengkapan operasional hotel seperti piring, pisau, dan peralatan lainnya, sehingga proses pencatatan dan pelacakan menjadi lebih efisien.',
    technologies: ['PHP', 'CodeIgniter', 'MySQL', 'Bootstrap'],
    demoUrl: '',
    repoUrl: '',
    imageUrl: '',
    featured: true
  },
  {
    id: 'port-sql-1',
    title: 'Sistem Invoice',
    category: 'Web Application',
    description: 'Sistem berbasis web untuk membantu proses pembuatan, pencatatan, dan monitoring invoice secara terstruktur dengan penomoran otomatis dan laporan rekap.',
    technologies: ['PHP', 'CodeIgniter', 'MySQL', 'Bootstrap'],
    demoUrl: '',
    repoUrl: '',
    imageUrl: '',
    featured: true
  },
  {
    id: 'port-sql-2',
    title: 'Sistem Absensi Face Recognition',
    category: 'Attendance System',
    description: 'Sistem absensi berbasis web yang mengintegrasikan teknologi pengenalan wajah untuk mencatat dan memonitor kehadiran karyawan secara otomatis dan real-time.',
    technologies: ['PHP', 'JavaScript', 'MySQL', 'Face Recognition API'],
    demoUrl: '',
    repoUrl: '',
    imageUrl: '',
    featured: true
  },
  {
    id: 'port-sql-3',
    title: 'Sistem Blasting Plan — AKP',
    category: 'Web Application',
    description: 'Sistem berbasis web untuk membantu pengelolaan dan penyusunan data blasting plan secara terstruktur dan terdokumentasi guna mendukung efisiensi operasional.',
    technologies: ['PHP', 'CodeIgniter', 'MySQL', 'Bootstrap'],
    demoUrl: '',
    repoUrl: '',
    imageUrl: '',
    featured: true
  }
]

const DEFAULT_COVER_LETTER_TEMPLATE = `Hal: Lamaran Pekerjaan - {{position}}

Kepada Yth.
HRD / Tim Rekrutmen {{company}}
Di Tempat

Dengan hormat,

Sehubungan dengan informasi lowongan pekerjaan yang saya peroleh bahwa {{company}} saat ini sedang membuka kesempatan berkarir untuk posisi {{position}}, melalui surat ini saya bermaksud mengajukan diri untuk bergabung dengan tim profesional di perusahaan yang Bapak/Ibu pimpin.

Saya memiliki latar belakang di bidang Teknik Informatika dengan keahlian dalam pengembangan web (PHP, CodeIgniter, JavaScript), pengolahan data menggunakan Python, serta instalasi dan maintenance perangkat jaringan dan komputer. Selama pengalaman saya, saya terbiasa membangun sistem informasi operasional yang andal, scalable, dan dirancang khusus untuk mempermudah alur operasional bisnis.

Besar harapan saya untuk diberikan kesempatan menghadiri sesi wawancara, agar saya dapat memaparkan lebih detail mengenai portofolio proyek dan kontribusi nyata yang siap saya berikan bagi kemajuan {{company}}.

Demikian surat lamaran ini saya sampaikan. Bersama ini saya lampirkan pula Curriculum Vitae (CV) dan tautan portofolio terbaru saya sebagai bahan pertimbangan. Atas perhatian dan kesempatan yang Bapak/Ibu berikan, saya ucapkan terima kasih.

Hormat saya,

{{name}}
{{phone}} | {{email}}`

export const useProfileStore = defineStore('profile', {
  state: () => {
    const savedProfile = localStorage.getItem('autoapply_profile')
    const savedExp = localStorage.getItem('autoapply_experiences')
    const savedEdu = localStorage.getItem('autoapply_educations')
    const savedSkills = localStorage.getItem('autoapply_skills')
    const savedPort = localStorage.getItem('autoapply_portfolios')
    const savedCoverLetter = localStorage.getItem('autoapply_cover_letter_template')
    const savedLastSync = localStorage.getItem('autoapply_last_supabase_sync')

    return {
      profile: savedProfile ? JSON.parse(savedProfile) : DEFAULT_PROFILE,
      experiences: savedExp ? JSON.parse(savedExp) : DEFAULT_EXPERIENCES,
      educations: savedEdu ? JSON.parse(savedEdu) : DEFAULT_EDUCATIONS,
      skills: savedSkills ? JSON.parse(savedSkills) : DEFAULT_SKILLS,
      portfolios: savedPort ? JSON.parse(savedPort) : DEFAULT_PORTFOLIOS,
      masterCoverLetter: savedCoverLetter || DEFAULT_COVER_LETTER_TEMPLATE,
      isSyncing: false,
      isFetchingSupabase: false,
      lastSyncedAt: savedLastSync || null,
      isSupabaseLoaded: false
    }
  },

  actions: {
    saveProfile(newProfile) {
      this.profile = { ...this.profile, ...newProfile }
      this.persist()
    },

    setMasterCoverLetter(content) {
      this.masterCoverLetter = content
      localStorage.setItem('autoapply_cover_letter_template', content)
    },

    addExperience(exp) {
      this.experiences.unshift({ ...exp, id: 'exp-' + Date.now() })
      this.persist()
    },

    updateExperience(id, updated) {
      const idx = this.experiences.findIndex(e => e.id === id)
      if (idx !== -1) {
        this.experiences[idx] = { ...this.experiences[idx], ...updated }
        this.persist()
      }
    },

    deleteExperience(id) {
      this.experiences = this.experiences.filter(e => e.id !== id)
      this.persist()
    },

    addEducation(edu) {
      this.educations.unshift({ ...edu, id: 'edu-' + Date.now() })
      this.persist()
    },

    updateEducation(id, updated) {
      const idx = this.educations.findIndex(e => e.id === id)
      if (idx !== -1) {
        this.educations[idx] = { ...this.educations[idx], ...updated }
        this.persist()
      }
    },

    deleteEducation(id) {
      this.educations = this.educations.filter(e => e.id !== id)
      this.persist()
    },

    addSkill(skill) {
      this.skills.push({ ...skill, id: 'sk-' + Date.now() })
      this.persist()
    },

    deleteSkill(id) {
      this.skills = this.skills.filter(s => s.id !== id)
      this.persist()
    },

    toggleSkillHighlight(id) {
      const item = this.skills.find(s => s.id === id)
      if (item) {
        item.isHighlighted = !item.isHighlighted
        this.persist()
      }
    },

    addPortfolio(item) {
      this.portfolios.unshift({ ...item, id: 'port-' + Date.now() })
      this.persist()
    },

    updatePortfolio(id, updated) {
      const idx = this.portfolios.findIndex(p => p.id === id)
      if (idx !== -1) {
        this.portfolios[idx] = { ...this.portfolios[idx], ...updated }
        this.persist()
      }
    },

    deletePortfolio(id) {
      this.portfolios = this.portfolios.filter(p => p.id !== id)
      this.persist()
    },

    resetToDefaults() {
      this.profile = JSON.parse(JSON.stringify(DEFAULT_PROFILE))
      this.experiences = JSON.parse(JSON.stringify(DEFAULT_EXPERIENCES))
      this.educations = JSON.parse(JSON.stringify(DEFAULT_EDUCATIONS))
      this.skills = JSON.parse(JSON.stringify(DEFAULT_SKILLS))
      this.portfolios = JSON.parse(JSON.stringify(DEFAULT_PORTFOLIOS))
      this.masterCoverLetter = DEFAULT_COVER_LETTER_TEMPLATE
      this.persist()
    },

    persist() {
      localStorage.setItem('autoapply_profile', JSON.stringify(this.profile))
      localStorage.setItem('autoapply_experiences', JSON.stringify(this.experiences))
      localStorage.setItem('autoapply_educations', JSON.stringify(this.educations))
      localStorage.setItem('autoapply_skills', JSON.stringify(this.skills))
      localStorage.setItem('autoapply_portfolios', JSON.stringify(this.portfolios))
      localStorage.setItem('autoapply_cover_letter_template', this.masterCoverLetter)
    },

    async syncToSupabase() {
      const client = getSupabaseClient()
      if (!client) throw new Error('Supabase belum dikonfigurasi.')

      this.isSyncing = true
      try {
        const { error: profError } = await client.from('profiles').upsert({
          full_name: this.profile.fullName,
          headline: this.profile.headline,
          email: this.profile.email,
          phone: this.profile.phone,
          location: this.profile.location,
          linkedin_url: this.profile.linkedin,
          github_url: this.profile.github,
          portfolio_url: this.profile.portfolioUrl,
          bio: this.profile.bio,
          updated_at: new Date().toISOString()
        })
        if (profError) throw profError

        const now = new Date().toISOString()
        this.lastSyncedAt = now
        localStorage.setItem('autoapply_last_supabase_sync', now)

        return { success: true, message: 'Data profil berhasil disinkronkan ke Supabase!' }
      } catch (err) {
        console.error('Supabase sync error:', err)
        throw err
      } finally {
        this.isSyncing = false
      }
    },

    // Muat semua data langsung dari Supabase ke state aplikasi
    async fetchFromSupabase() {
      const client = getSupabaseClient()
      if (!client) {
        return { success: false, message: 'Supabase belum dikonfigurasi.' }
      }

      this.isFetchingSupabase = true
      try {
        let loadedItems = { profile: false, portfolios: 0, experiences: 0 }

        // 1. Ambil Profil dari Supabase
        const { data: profileRows, error: profErr } = await client
          .from('profiles')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(1)

        let profileId = null
        if (!profErr && profileRows && profileRows.length > 0) {
          const p = profileRows[0]
          profileId = p.id
          this.profile = {
            fullName: p.full_name || this.profile.fullName,
            headline: p.headline || this.profile.headline,
            email: p.email || this.profile.email,
            phone: p.phone || this.profile.phone,
            location: p.location || this.profile.location,
            linkedin: p.linkedin_url || this.profile.linkedin,
            github: p.github_url || this.profile.github,
            portfolioUrl: p.portfolio_url || this.profile.portfolioUrl,
            bio: p.bio || this.profile.bio
          }
          loadedItems.profile = true
        }

        // 2. Ambil Portofolio: Utamakan matching profile_id, fallback ke semua portfolios
        let portQuery = client.from('portfolios').select('*').order('created_at', { ascending: false })
        if (profileId) {
          const { data: userPorts } = await client
            .from('portfolios')
            .select('*')
            .eq('profile_id', profileId)
            .order('created_at', { ascending: false })

          if (userPorts && userPorts.length > 0) {
            portQuery = { data: userPorts, error: null }
          } else {
            portQuery = await client.from('portfolios').select('*').order('created_at', { ascending: false })
          }
        } else {
          portQuery = await portQuery
        }

        const { data: portRows, error: portErr } = portQuery
        if (!portErr && portRows && portRows.length > 0) {
          this.portfolios = portRows.map(row => {
            let techs = []
            if (Array.isArray(row.technologies)) {
              techs = row.technologies
            } else if (typeof row.technologies === 'string') {
              try {
                const parsed = JSON.parse(row.technologies)
                techs = Array.isArray(parsed) ? parsed : row.technologies.split(',').map(s => s.trim())
              } catch {
                techs = row.technologies.split(',').map(s => s.trim())
              }
            }

            return {
              id: String(row.id),
              title: row.title || 'Proyek Portofolio',
              category: row.category || 'Web Application',
              description: row.description || '',
              technologies: techs,
              demoUrl: row.demo_url || '',
              repoUrl: row.repo_url || '',
              imageUrl: row.thumbnail_url || '',
              featured: row.featured !== false
            }
          })
          loadedItems.portfolios = this.portfolios.length
        }

        this.persist()
        const now = new Date().toISOString()
        this.lastSyncedAt = now
        localStorage.setItem('autoapply_last_supabase_sync', now)
        this.isSupabaseLoaded = true

        return {
          success: true,
          message: `Berhasil tersinkron dengan Supabase! ${this.portfolios.length} proyek portofolio siap digunakan.`
        }
      } catch (err) {
        console.error('Fetch from Supabase error:', err)
        throw err
      } finally {
        this.isFetchingSupabase = false
      }
    }
  }
})
