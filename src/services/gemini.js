// Google Gemini API Service for Multimodal Screenshot Analysis & Document Tailoring
import { 
  generateTailoredParagraph1, 
  generateTailoredParagraph2, 
  formatFullCoverLetterText, 
  formatIndonesianDate,
  detectJobCategory 
} from './coverLetterGenerator'

let cachedWorkingModel = null

export function getGeminiApiKey() {
  return localStorage.getItem('autoapply_gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || ''
}

export function cleanIndonesianPhoneNumber(phoneStr) {
  if (!phoneStr) return ''
  let cleaned = phoneStr.replace(/[^\d+]/g, '')
  if (cleaned.startsWith('+62')) {
    cleaned = cleaned.substring(1) // 62...
  } else if (cleaned.startsWith('08')) {
    cleaned = '628' + cleaned.substring(2)
  } else if (cleaned.startsWith('8')) {
    cleaned = '628' + cleaned.substring(1)
  }
  return cleaned
}

export function extractContactsFromText(text) {
  const result = { email: '', phone: '' }
  if (!text) return result

  // Email regex
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi
  const emailMatches = text.match(emailRegex)
  if (emailMatches && emailMatches.length > 0) {
    const gmailMatch = emailMatches.find(e => e.toLowerCase().includes('gmail.com'))
    result.email = gmailMatch || emailMatches[0]
  }

  // Indonesian phone regex (08xx, +628xx, 628xx)
  const phoneRegex = /(?:\+?62|0)8[1-9][0-9]{7,11}/g
  const phoneMatches = text.match(phoneRegex)
  if (phoneMatches && phoneMatches.length > 0) {
    result.phone = cleanIndonesianPhoneNumber(phoneMatches[0])
  }

  return result
}

function parseJsonSafely(rawText) {
  if (!rawText) return null
  const cleaned = rawText.trim()
  try {
    return JSON.parse(cleaned)
  } catch {}

  // Match markdown code block ```json ... ```
  const blockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (blockMatch && blockMatch[1]) {
    try {
      return JSON.parse(blockMatch[1].trim())
    } catch {}
  }

  // Match from first '{' to last '}'
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1))
    } catch {}
  }

  return null
}

// Recommended active models ordered by preference
const FALLBACK_MODELS = [
  'gemini-3.8-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro-latest'
]

/**
 * Dynamically discover available models supporting generateContent for this API key
 */
async function discoverAvailableModels(apiKey) {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    if (res.ok) {
      const data = await res.json()
      if (data.models && Array.isArray(data.models)) {
        // Exclude deprecated models like gemini-2.5-flash
        const supported = data.models
          .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
          .map(m => m.name.replace(/^models\//, ''))
          .filter(name => !name.includes('2.5-flash'))

        if (supported.length > 0) {
          // Sort according to preferred order
          const sorted = []
          for (const pref of FALLBACK_MODELS) {
            const match = supported.find(m => m === pref || m.includes(pref))
            if (match && !sorted.includes(match)) {
              sorted.push(match)
            }
          }
          for (const m of supported) {
            if (!sorted.includes(m)) sorted.push(m)
          }
          return sorted
        }
      }
    }
  } catch (err) {
    console.warn('Could not auto-discover Gemini models, will use standard candidates:', err)
  }

  return FALLBACK_MODELS
}

/**
 * Call Gemini REST API directly with vision capability
 */
async function callGeminiApi(prompt, imageBase64, mimeType = 'image/jpeg', apiKey = '') {
  const key = apiKey || getGeminiApiKey()
  if (!key) {
    throw new Error('Gemini API Key belum diisi. Silakan masukkan API Key Anda di menu Pengaturan.')
  }

  // Get candidate model list
  let candidateModels = await discoverAvailableModels(key)
  if (cachedWorkingModel && candidateModels.includes(cachedWorkingModel)) {
    // Put cached working model first
    candidateModels = [cachedWorkingModel, ...candidateModels.filter(m => m !== cachedWorkingModel)]
  }

  let lastError = null

  for (const model of candidateModels) {
    // Skip known unavailable/deprecated models
    if (model.includes('2.5-flash')) continue

    const apiVersions = ['v1beta', 'v1']

    for (const apiVer of apiVersions) {
      const url = `https://generativelanguage.googleapis.com/${apiVer}/models/${model}:generateContent?key=${key}`

      const parts = []
      if (imageBase64) {
        const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
        parts.push({
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: cleanBase64
          }
        })
      }
      parts.push({ text: prompt })

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature: 0.2
            }
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const msg = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
          throw new Error(msg)
        }

        const data = await response.json()
        const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (!textOutput) throw new Error('AI tidak mengembalikan respon teks.')

        const parsed = parseJsonSafely(textOutput)
        if (!parsed) {
          throw new Error('Format respon AI bukan JSON valid: ' + textOutput.substring(0, 100))
        }

        // Successfully worked: cache this model
        cachedWorkingModel = model
        return parsed
      } catch (err) {
        lastError = err
        // If error occurred with cached model, invalidate cache
        if (cachedWorkingModel === model) {
          cachedWorkingModel = null
        }
        console.warn(`Model ${model} (${apiVer}) failed:`, err.message)
      }
    }
  }

  throw lastError || new Error('Gagal menghubungi Gemini API. Pastikan API Key Anda aktif.')
}

/**
 * Scan job screenshot and extract structured information
 */
export async function analyzeJobScreenshot(imageBase64, mimeTypeOrApiKey = 'image/jpeg', explicitApiKey = '') {
  let mimeType = 'image/jpeg'
  let apiKey = explicitApiKey

  if (typeof mimeTypeOrApiKey === 'string') {
    if (mimeTypeOrApiKey.startsWith('image/')) {
      mimeType = mimeTypeOrApiKey
    } else if (mimeTypeOrApiKey.length > 5) {
      apiKey = mimeTypeOrApiKey
    }
  }

  if (!apiKey) {
    apiKey = getGeminiApiKey()
  }

  if (!apiKey) {
    console.log('No Gemini API key, using demo parser')
    return getMockJobData()
  }

  const prompt = `
Analisis gambar lowongan pekerjaan (job vacancy poster/screenshot) ini secara teliti.
Ekstrak semua informasi berikut dan kembalikan HANYA format JSON valid tanpa format markdown lain:
{
  "companyName": "Nama Perusahaan / Startup / Instansi (jika tidak tertera, tulis 'Perusahaan Terkait')",
  "jobTitle": "Nama Posisi / Pekerjaan yang dicari",
  "email": "Email rekruter / HRD untuk melamar (prioritaskan @gmail.com atau domain resmi perusahaan jika ada)",
  "phone": "Nomor WhatsApp / Telepon untuk melamar (format nomor saja, e.g. 08123456789 atau 628123456789)",
  "location": "Kota / Lokasi penempatan kerja atau 'Remote' / 'Hybrid' / 'Onsite'",
  "employmentType": "Full Time / Part Time / Internship / Freelance / Kontrak",
  "salary": "Range gaji jika disebutkan (e.g. Rp 5.000.000 - Rp 8.000.000 atau 'Kompetitif / Tidak disebutkan')",
  "deadline": "Batas akhir pendaftaran jika ada atau '-'",
  "requirements": ["Syarat 1", "Syarat 2", "Kualifikasi 3"],
  "responsibilities": ["Tanggung jawab 1", "Tanggung jawab 2"],
  "skillsRequired": ["Skill/Tools 1 (e.g. Vue.js, Tailwind, Git, Figma)"],
  "summary": "Ringkasan singkat lowongan ini dalam 2-3 kalimat bahasa Indonesia",
  "rawText": "Teks mentah yang berhasil dibaca dari gambar (OCR)"
}
Pastikan alamat email dan nomor telepon diekstrak seakurat mungkin jika tertera di gambar poster!
`

  try {
    const result = await callGeminiApi(prompt, imageBase64, mimeType, apiKey)

    // Extra safeguard: run regex contact extractor on raw text in case model omitted it
    if (!result.email || !result.phone) {
      const contacts = extractContactsFromText(result.rawText || '')
      if (!result.email && contacts.email) result.email = contacts.email
      if (!result.phone && contacts.phone) result.phone = contacts.phone
    }

    if (result.phone) {
      result.phone = cleanIndonesianPhoneNumber(result.phone)
    }

    return result
  } catch (error) {
    console.error('Gemini vision analysis error:', error)
    throw error
  }
}

/**
 * Generate tailored Cover Letter, tailored CV bullet points, and WhatsApp message
 */
export async function tailorApplicationDocuments(arg1, arg2, arg3, arg4) {
  let jobData = {}
  let userProfile = {}
  let masterCoverLetter = ''
  let portfolioItems = []
  let apiKey = ''

  if (arg1 && typeof arg1 === 'object' && ('jobData' in arg1 || 'userProfile' in arg1)) {
    jobData = arg1.jobData || {}
    userProfile = arg1.userProfile || {}
    masterCoverLetter = arg1.masterCoverLetter || ''
    portfolioItems = arg1.portfolioItems || (userProfile.portfolios || [])
    apiKey = arg1.apiKey || ''
  } else {
    jobData = arg1 || {}
    userProfile = (arg2 && arg2.profile) ? { ...arg2.profile, ...arg2 } : (arg2 || {})
    masterCoverLetter = arg3 || ''
    if (typeof arg4 === 'string') {
      apiKey = arg4
      portfolioItems = userProfile.portfolios || []
    } else if (Array.isArray(arg4)) {
      portfolioItems = arg4
    }
  }

  if (!apiKey) {
    apiKey = getGeminiApiKey()
  }

  if (!apiKey) {
    return generateFallbackTailoredDocs({ jobData, userProfile, masterCoverLetter, portfolioItems })
  }

  const prompt = `
Kamu adalah konsultan karir profesional terbaik di Indonesia.
Tugasmu adalah menyesuaikan (tailor) Surat Lamaran Pekerjaan, ringkasan CV, dan pesan WhatsApp lamaran kerja agar SANGAT RELEVAN dan MEMIKAT bagi perusahaan yang dituju.

DATA LOWONGAN PEKERJAAN:
Perusahaan: ${jobData.companyName || 'Perusahaan'}
Posisi: ${jobData.jobTitle || 'Posisi'}
Kualifikasi & Syarat: ${JSON.stringify(jobData.requirements || [])}
Tanggung Jawab: ${JSON.stringify(jobData.responsibilities || [])}
Skill Dibutuhkan: ${JSON.stringify(jobData.skillsRequired || [])}

DATA PELAMAR:
Nama: ${userProfile.fullName || 'Pelamar'}
Email: ${userProfile.email || ''}
Telepon/WA: ${userProfile.phone || ''}
Headline / Peran: ${userProfile.headline || ''}
Ringkasan Diri: ${userProfile.bio || ''}
Pengalaman Kerja: ${JSON.stringify(userProfile.experiences || [])}
Pendidikan: ${JSON.stringify(userProfile.educations || [])}
Keahlian Pelamar: ${JSON.stringify(userProfile.skills || [])}
Portofolio Proyek: ${JSON.stringify(portfolioItems || [])}

TEMPLATE DASAR SURAT LAMARAN PELAMAR:
"""
${masterCoverLetter || ''}
"""

Instruksi Khusus:
1. Buat "coverLetterParagraph1": 1 paragraf inti kualifikasi & pengalaman (4-6 kalimat) yang SANGAT PRESISI menyesuaikan dengan BIDANG lowongan pekerjaan ini (${jobData.jobTitle || 'posisi'}).
   - Jika bidang Administrasi / Operasional / Gudang / Kasir: soroti ketelitian, manajemen dokumen/data, koordinasi, dan sistem operasional.
   - Jika bidang IT / Software / Web: soroti tech stack, database, perancangan sistem, problem solving, dan REST API.
   - Jika bidang IT Support / Hardware / Jaringan: soroti troubleshooting hardware, jaringan LAN/WLAN, pemeliharaan komputer, CCTV, dan helpdesk.
   - Jika bidang Data / AI / Python: soroti pengolahan data, analisis, Python, otomasi, dan machine learning.
   - Jika bidang Desain Grafis / Kreatif / Video: soroti estetika visual, software kreatif, kepekaan layout/tipografi, dan portofolio desain.
   - Jika bidang Marketing / Sales: soroti komunikasi persuasif, digital marketing, media sosial, dan orientasi target.
   - Jika bidang Customer Service / Pelayanan / F&B: soroti komunikasi prima, keramahan, penanganan keluhan, dan service excellence.
   - Jika bidang lainnya: sesuaikan latar belakang pelamar agar relevan dan menarik bagi perusahaan penerima.
2. Buat "coverLetterParagraph2": Paragraf penutup formal dan kesiapan melampirkan berkas CV serta portofolio.
3. Buat "tailoredCoverLetter": Teks lengkap surat lamaran formal standar Indonesia (Tanggal, Perihal, Alamat HRD, Salam Pembuka, Data Diri Pelamar, Paragraf Isi yang disesuaikan dengan bidang loker, Penutup, dan Tanda Tangan). Sertakan tanggal hari ini, kepada Yth. HRD / Tim Rekrutmen ${jobData.companyName || 'Perusahaan'}.
4. Buat "tailoredEmailSubject": subjek email resmi standar HR (Contoh: "Lamaran Pekerjaan - ${jobData.jobTitle || 'Posisi'} - ${userProfile.fullName || 'Pelamar'}").
5. Buat "tailoredWhatsAppMessage": pesan pengantar profesional untuk dikirim via WhatsApp. Cantumkan salam sopan, perkenalan diri, posisi yang dilamar, ringkasan 2-3 proyek portofolio pelamar yang paling relevan (judul proyek dan teknologi yang digunakan), tautan portfolio/GitHub jika ada, serta kalimat bahwa pelamar melampirkan dokumen PDF CV ATS.
6. Buat "recommendedSkills": (array nama skill pelamar yang paling cocok dan harus di-highlight).
7. Buat "tailoredProfessionalSummary": (1 paragraf ringkasan CV yang disesuaikan dengan posisi ini).
8. Tentukan "recommendedPortfolioTitles": (array judul portofolio milik pelamar yang paling relevan dengan posisi ini).

Kembalikan HANYA format JSON valid tanpa format markdown lain:
{
  "coverLetterParagraph1": "Saya memiliki latar belakang... [paragraf kualifikasi yang disesuaikan persis dengan bidang loker ini]",
  "coverLetterParagraph2": "Sebagai bahan pertimbangan Bapak/Ibu, saya siap melampirkan...",
  "tailoredCoverLetter": "Teks lengkap surat lamaran formal dalam bahasa Indonesia...",
  "tailoredEmailSubject": "Lamaran Pekerjaan - [Posisi] - [Nama]",
  "tailoredWhatsAppMessage": "Selamat pagi/siang Tim HRD [Perusahaan], perkenalkan saya [Nama]...",
  "tailoredProfessionalSummary": "Ringkasan profesional CV yang disesuaikan...",
  "recommendedSkills": ["Skill 1", "Skill 2"],
  "recommendedPortfolioTitles": ["Judul Proyek 1", "Judul Proyek 2"]
}
`

  try {
    const result = await callGeminiApi(prompt, null, null, apiKey)
    return result
  } catch (error) {
    console.error('Gemini tailor documents error:', error)
    return generateFallbackTailoredDocs({ jobData, userProfile, masterCoverLetter, portfolioItems })
  }
}

function generateFallbackTailoredDocs({ jobData, userProfile, masterCoverLetter, portfolioItems }) {
  const company = jobData.companyName || 'HRD / Tim Rekrutmen'
  const position = jobData.jobTitle || 'Posisi Terkait'
  const name = userProfile.fullName || 'Nama Pelamar'
  const today = formatIndonesianDate()

  const paragraph1 = generateTailoredParagraph1(jobData, userProfile)
  const paragraph2 = generateTailoredParagraph2()

  const city = userProfile.location ? userProfile.location.split(',').pop().trim() : 'Magelang'
  const companyCity = jobData.location || (company.startsWith('PT') || company.startsWith('CV') ? `Kota ${company.replace(/^(PT|CV)\s+/i, '')}` : 'Di Tempat')

  const fullLetter = formatFullCoverLetterText({
    cityDate: `${city}, ${today}`,
    position,
    company,
    companyCity,
    applicantName: name,
    birthPlaceDate: userProfile.birthPlaceDate || 'Magelang, 21 April 2001',
    education: (userProfile.educations?.[0]?.degree ? `${userProfile.educations[0].degree} ${userProfile.educations[0].major || ''}`.trim() : null) || userProfile.headline || 'S1 Teknik Informatika',
    domicile: city,
    phone: userProfile.phone || '',
    email: userProfile.email || '',
    bodyParagraph1: paragraph1,
    bodyParagraph2: paragraph2
  })

  const subject = `Lamaran Pekerjaan: ${position} - ${name}`
  const wa = `Halo HRD / Rekruter ${company},\n\nPerkenalkan saya ${name}. Saya bermaksud melamar lowongan ${position} yang sedang dibuka.\n\nBersama pesan ini saya melampirkan berkas Curriculum Vitae (CV) dan tautan portofolio proyek saya. Terima kasih atas perhatian dan kesempatannya.`

  return {
    tailoredCoverLetter: fullLetter,
    coverLetterParagraph1: paragraph1,
    coverLetterParagraph2: paragraph2,
    tailoredEmailSubject: subject,
    tailoredWhatsAppMessage: wa,
    tailoredProfessionalSummary: userProfile.bio || 'Profesional berorientasi hasil dengan keahlian yang relevan untuk mendukung produktivitas perusahaan.',
    recommendedSkills: (userProfile.skills || []).slice(0, 5).map(s => s.name || s),
    recommendedPortfolioTitles: (portfolioItems || []).slice(0, 3).map(p => p.title || p)
  }
}

export function getMockJobData() {
  return {
    companyName: 'PT Teknologi Digital Nusantara',
    jobTitle: 'Junior Web Developer (PHP & Vue)',
    email: 'karir.digitalnusantara@gmail.com',
    phone: '081298765432',
    location: 'Jakarta Selatan (Hybrid)',
    employmentType: 'Full Time',
    salary: 'Rp 6.000.000 - Rp 9.000.000',
    deadline: '15 November 2026',
    requirements: [
      'Pendidikan minimal D3/S1 Teknik Informatika atau bidang terkait',
      'Menguasai PHP framework (CodeIgniter/Laravel) dan database MySQL',
      'Memahami dasar frontend modern (Vue.js, HTML5, CSS3, Tailwind)',
      'Memiliki kemampuan problem solving yang baik dan terbiasa bekerja dalam tim',
      'Portofolio proyek aplikasi web menjadi nilai tambah utama'
    ],
    responsibilities: [
      'Mengembangkan dan memelihara modul aplikasi web internal',
      'Melakukan integrasi API pihak ketiga dan optimasi database',
      'Berkolaborasi dengan tim UI/UX dan Project Manager'
    ],
    skillsRequired: ['PHP', 'CodeIgniter', 'MySQL', 'Vue.js', 'Tailwind CSS', 'Git'],
    summary: 'Lowongan Junior Web Developer untuk menangani pengembangan sistem informasi dan aplikasi web modern di perusahaan IT berkembang di Jakarta.',
    rawText: 'WE ARE HIRING! Junior Web Developer. Send your CV & Portfolio to karir.digitalnusantara@gmail.com or WhatsApp: 0812-9876-5432. Requirements: PHP, CodeIgniter, MySQL, Vue.js.'
  }
}
