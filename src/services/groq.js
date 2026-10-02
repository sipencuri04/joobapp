// Groq API Service for Ultra-Fast Multimodal Vision & Document Tailoring

import { cleanIndonesianPhoneNumber, extractContactsFromText } from './gemini'

export function getGroqApiKey() {
  return localStorage.getItem('autoapply_groq_api_key') || import.meta.env.VITE_GROQ_API_KEY || ''
}

function parseJsonSafely(rawText) {
  if (!rawText) return null
  const cleaned = rawText.trim()
  try {
    return JSON.parse(cleaned)
  } catch {}

  const blockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (blockMatch && blockMatch[1]) {
    try {
      return JSON.parse(blockMatch[1].trim())
    } catch {}
  }

  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1))
    } catch {}
  }

  return null
}

/**
 * Test Groq API connection with a lightweight prompt
 */
export async function testGroqConnection(apiKey) {
  const key = apiKey || getGroqApiKey()
  if (!key) {
    return { success: false, message: 'Groq API Key belum diisi.' }
  }

  const testModels = [
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant'
  ]

  let lastErrMsg = ''

  for (const model of testModels) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'OK' }],
          max_tokens: 5
        })
      })

      if (response.ok) {
        return { success: true, message: `Koneksi ke Groq API berhasil! Model ${model} aktif & siap digunakan.` }
      } else {
        const errData = await response.json().catch(() => ({}))
        lastErrMsg = errData.error?.message || `HTTP ${response.status}: ${response.statusText}`
      }
    } catch (err) {
      lastErrMsg = err.message
    }
  }

  return { success: false, message: 'Gagal terhubung ke Groq: ' + lastErrMsg }
}

/**
 * Scan job vacancy screenshot with Groq Multimodal Vision (Qwen 3.8 / Llama 3.2 Vision)
 */
export async function analyzeJobScreenshotWithGroq(dataUrl, apiKey = '') {
  const key = apiKey || getGroqApiKey()
  if (!key) {
    throw new Error('Groq API Key belum diisi. Masukkan API Key Groq Anda di menu Pengaturan.')
  }

  const visionModels = [
    'qwen/qwen3.8-27b',
    'llama-3.2-11b-vision-preview',
    'llama-3.2-90b-vision-preview'
  ]
  let lastError = null

  const promptText = `
Analisis gambar poster / screenshot lowongan pekerjaan ini dengan teliti.
Ekstrak semua informasi berikut dan kembalikan HANYA format JSON valid tanpa kata pengantar apapun:
{
  "companyName": "Nama Perusahaan / Instansi (atau 'Perusahaan Terkait')",
  "jobTitle": "Nama Posisi / Pekerjaan yang dicari",
  "email": "Email rekruter / HRD untuk melamar (prioritaskan @gmail.com atau domain resmi perusahaan jika ada)",
  "phone": "Nomor WhatsApp / Telepon untuk melamar (format nomor saja, e.g. 08123456789 atau 628123456789)",
  "location": "Kota / Lokasi penempatan kerja atau 'Remote' / 'Hybrid' / 'Onsite'",
  "employmentType": "Full Time / Part Time / Internship / Freelance / Kontrak",
  "salary": "Range gaji jika disebutkan atau 'Kompetitif / Tidak disebutkan'",
  "deadline": "Batas akhir pendaftaran jika ada atau '-'",
  "requirements": ["Syarat 1", "Syarat 2", "Kualifikasi 3"],
  "responsibilities": ["Tanggung jawab 1", "Tanggung jawab 2"],
  "skillsRequired": ["Skill/Tools 1 (e.g. PHP, CodeIgniter, Vue.js, MySQL)"],
  "summary": "Ringkasan singkat lowongan ini dalam 2-3 kalimat bahasa Indonesia",
  "rawText": "Teks mentah yang berhasil dibaca dari gambar (OCR)"
}
Pastikan nomor WhatsApp dan email diekstrak seakurat mungkin jika tertera di gambar poster!
`

  for (const model of visionModels) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: promptText },
                {
                  type: 'image_url',
                  image_url: {
                    url: dataUrl
                  }
                }
              ]
            }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const msg = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
        throw new Error(msg)
      }

      const resData = await response.json()
      const textOutput = resData.choices?.[0]?.message?.content
      if (!textOutput) throw new Error('Groq tidak mengembalikan respon teks.')

      const result = parseJsonSafely(textOutput)
      if (!result) throw new Error('Format output Groq bukan JSON valid.')

      // Extra safeguard: regex contact extraction if empty
      if (!result.email || !result.phone) {
        const contacts = extractContactsFromText(result.rawText || '')
        if (!result.email && contacts.email) result.email = contacts.email
        if (!result.phone && contacts.phone) result.phone = contacts.phone
      }

      if (result.phone) {
        result.phone = cleanIndonesianPhoneNumber(result.phone)
      }

      return result
    } catch (err) {
      console.warn(`Groq vision model ${model} failed:`, err.message)
      lastError = err
    }
  }

  throw lastError || new Error('Gagal menganalisis gambar dengan Groq Vision.')
}

/**
 * Tailor documents with Groq Llama 3.3 70B Versatile
 */
export async function tailorApplicationDocumentsWithGroq(arg1, arg2, arg3, arg4) {
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

  const key = apiKey || getGroqApiKey()
  if (!key) {
    throw new Error('Groq API Key belum diisi.')
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
1. Buat "tailoredCoverLetter" dalam bahasa Indonesia yang sangat profesional, sopan, persuasif, dan menyoroti kecocokan pengalaman & keahlian pelamar dengan syarat lowongan ini.
2. Buat "tailoredEmailSubject" subjek email resmi standar HR (Contoh: "Lamaran Pekerjaan - ${jobData.jobTitle || 'Posisi'} - ${userProfile.fullName || 'Pelamar'}").
3. Buat "tailoredWhatsAppMessage" pesan pengantar profesional untuk dikirim via WhatsApp. Cantumkan salam sopan, perkenalan diri, posisi yang dilamar, ringkasan 2-3 proyek portofolio pelamar yang paling relevan (judul proyek dan teknologi yang digunakan), tautan portfolio/GitHub jika ada, serta kalimat bahwa pelamar melampirkan dokumen PDF CV ATS.
4. Buat "recommendedSkills" (array nama skill pelamar yang paling cocok dan harus di-highlight).
5. Buat "tailoredProfessionalSummary" (1 paragraf ringkasan CV yang disesuaikan dengan posisi ini).
6. Tentukan "recommendedPortfolioTitles" (array judul portofolio milik pelamar yang paling relevan dengan posisi ini).

Kembalikan HANYA format JSON valid berikut:
{
  "tailoredCoverLetter": "Teks lengkap surat lamaran formal dalam bahasa Indonesia...",
  "tailoredEmailSubject": "Lamaran Pekerjaan - [Posisi] - [Nama]",
  "tailoredWhatsAppMessage": "Selamat pagi/siang Tim HRD [Perusahaan], perkenalkan saya [Nama]...",
  "tailoredProfessionalSummary": "Ringkasan profesional CV yang disesuaikan...",
  "recommendedSkills": ["Skill 1", "Skill 2"],
  "recommendedPortfolioTitles": ["Judul Proyek 1", "Judul Proyek 2"]
}
`

  const textModels = [
    'openai/gpt-oss-120b',
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-20b',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant'
  ]
  let lastError = null

  for (const model of textModels) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          response_format: { type: 'json_object' }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `HTTP ${response.status}`)
      }

      const resData = await response.json()
      const textOutput = resData.choices?.[0]?.message?.content
      const parsed = parseJsonSafely(textOutput)
      if (!parsed) throw new Error('Respon Groq bukan JSON valid.')

      return parsed
    } catch (err) {
      console.warn(`Groq text model ${model} failed:`, err.message)
      lastError = err
    }
  }

  throw lastError || new Error('Gagal tailoring dokumen dengan Groq.')
}
