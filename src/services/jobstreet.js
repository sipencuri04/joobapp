// Client: ambil data lowongan dari link JobStreet lewat /api/jobstreet,
// lalu ubah menjadi format job yang sama dengan hasil scan screenshot.
import { extractContactsFromText, cleanIndonesianPhoneNumber } from './gemini'

export function findUrlInText(text = '') {
  const m = String(text).match(/https?:\/\/[^\s<>"']+/i)
  return m ? m[0].replace(/[).,]+$/, '') : ''
}

export function isJobstreetLink(text = '') {
  return /jobstreet\.(com|co\.id)/i.test(String(text))
}

export async function fetchJobstreetJob(link) {
  let res
  try {
    res = await fetch(`/api/jobstreet?url=${encodeURIComponent(link)}`)
  } catch {
    throw new Error('Tidak bisa terhubung ke server. Cek koneksi internet Anda.')
  }
  const data = await res.json().catch(() => null)
  if (!data) {
    throw new Error('Fitur link belum aktif di server ini. Pastikan sudah di-deploy ke Vercel (folder /api ikut ter-upload).')
  }
  if (!data.ok) throw new Error(data.error || 'Gagal membaca lowongan JobStreet.')
  return data.job
}

/** Teks lengkap lowongan untuk dianalisis AI. */
export function buildJobText(job) {
  return [
    `Posisi: ${job.title || '-'}`,
    `Perusahaan: ${job.company || '-'}`,
    `Lokasi: ${job.location || '-'}`,
    job.workType ? `Tipe: ${job.workType}` : '',
    job.salary ? `Gaji: ${job.salary}` : '',
    job.abstract ? `Ringkasan: ${job.abstract}` : '',
    '',
    'Deskripsi lowongan:',
    job.descriptionText || ''
  ].filter(l => l !== null).join('\n')
}

/** Ambil kota utama dari label lokasi JobStreet, contoh "Jatiuwung, Banten" → "Jatiuwung". */
function cityFromLocation(label = '') {
  return String(label).split(',')[0].replace(/\bRaya\b/i, '').trim()
}

/**
 * Ubah data JobStreet menjadi format job tanpa AI (heuristik sederhana).
 * Dipakai sebagai dasar, lalu dilengkapi AI bila API Key tersedia.
 */
export function jobstreetToJobData(job) {
  const contacts = extractContactsFromText(job.descriptionText || '')
  const bullets = Array.isArray(job.bullets) ? job.bullets : []
  const reqKeywords = /(pendidikan|minimal|min\.|pengalaman|menguasai|memahami|mampu|bersedia|usia|lulusan|s1|d3|degree|experience|knowledge|familiar|able to|proficien|skill|require)/i
  const requirements = bullets.filter(b => reqKeywords.test(b))
  const responsibilities = bullets.filter(b => !reqKeywords.test(b))

  return {
    companyName: job.company || '',
    jobTitle: job.title || '',
    availablePositions: job.title ? [job.title] : [],
    email: contacts.email || '',
    phone: job.phone ? cleanIndonesianPhoneNumber(job.phone) : (contacts.phone || ''),
    location: cityFromLocation(job.location),
    employmentType: job.workType || '',
    salary: job.salary || '',
    deadline: job.expiresAt ? new Date(job.expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-',
    requirements: (requirements.length ? requirements : bullets).slice(0, 10),
    responsibilities: responsibilities.slice(0, 10),
    skillsRequired: [],
    summary: job.abstract || '',
    rawText: buildJobText(job)
  }
}
