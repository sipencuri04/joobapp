// Inti pengambil data lowongan JobStreet (dipakai oleh Vercel function & Vite dev server).
// Hanya mengizinkan domain JobStreet agar endpoint tidak bisa disalahgunakan untuk fetch situs lain.

const ALLOWED_HOST = /(^|\.)jobstreet\.(com|co\.id)$/i
const UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36'

/** Ambil URL pertama dari teks (share dari app JobStreet sering berisi kalimat + link). */
export function extractUrl(input = '') {
  const m = String(input).match(/https?:\/\/[^\s<>"']+/i)
  if (m) return m[0].replace(/[).,]+$/, '')
  const bare = String(input).trim()
  if (/^[\w.-]*jobstreet\.(com|co\.id)\//i.test(bare)) return 'https://' + bare
  return ''
}

function getJobId(urlObj) {
  const fromQuery = urlObj.searchParams.get('jobId')
  if (fromQuery && /^\d+$/.test(fromQuery)) return fromQuery
  const m = urlObj.pathname.match(/\/job\/(\d{5,})/)
  return m ? m[1] : ''
}

function decodeEntities(s = '') {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

/** HTML deskripsi → teks rapi dengan bullet "• ". */
export function htmlToText(html = '') {
  return decodeEntities(
    String(html)
      .replace(/<\s*br\s*\/?>/gi, '\n')
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<\/(p|div|h[1-6]|ul|ol|li)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  )
    .split('\n')
    .map(l => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
}

function extractBullets(html = '') {
  const out = []
  const re = /<li[^>]*>([\s\S]*?)<\/li>/gi
  let m
  while ((m = re.exec(html))) {
    const t = htmlToText(m[1]).replace(/^•\s*/, '').trim()
    if (t) out.push(t)
  }
  return out
}

/** Ambil objek JSON setelah "window.SEEK_REDUX_DATA = " dengan pencocokan kurung kurawal. */
function extractReduxData(html) {
  const marker = 'window.SEEK_REDUX_DATA'
  const at = html.indexOf(marker)
  if (at === -1) return null
  const start = html.indexOf('{', at)
  if (start === -1) return null
  let depth = 0
  let inStr = false
  let esc = false
  for (let i = start; i < html.length; i++) {
    const c = html[i]
    if (inStr) {
      if (esc) esc = false
      else if (c === '\\') esc = true
      else if (c === '"') inStr = false
      continue
    }
    if (c === '"') inStr = true
    else if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) {
        try { return JSON.parse(html.slice(start, i + 1)) } catch { return null }
      }
    }
  }
  return null
}

function metaContent(html, prop) {
  const re = new RegExp(`<meta[^>]+(?:property|name)="${prop}"[^>]+content="([^"]*)"`, 'i')
  const m = html.match(re)
  return m ? decodeEntities(m[1]) : ''
}

function fail(status, error) {
  return { status, body: { ok: false, error } }
}

export async function fetchJobstreetJob(input) {
  const rawUrl = extractUrl(input)
  if (!rawUrl) return fail(400, 'Link tidak ditemukan. Tempel link lowongan JobStreet (contoh: https://id.jobstreet.com/id/job/12345678).')

  let urlObj
  try { urlObj = new URL(rawUrl) } catch { return fail(400, 'Format link tidak valid.') }
  if (!ALLOWED_HOST.test(urlObj.hostname)) {
    return fail(400, 'Saat ini baru mendukung link dari JobStreet (jobstreet.com / jobstreet.co.id).')
  }

  let jobId = getJobId(urlObj)

  // Link pendek / redirect: ikuti dulu untuk menemukan ID lowongan
  if (!jobId) {
    try {
      const r = await fetch(urlObj.href, { redirect: 'follow', headers: { 'User-Agent': UA } })
      const finalUrl = new URL(r.url)
      if (ALLOWED_HOST.test(finalUrl.hostname)) jobId = getJobId(finalUrl)
    } catch { /* abaikan */ }
  }
  if (!jobId) return fail(400, 'ID lowongan tidak ditemukan di link. Buka lowongannya di JobStreet lalu salin link halaman detail lowongan.')

  const pageUrl = `https://id.jobstreet.com/id/job/${jobId}`
  let html = ''
  try {
    const r = await fetch(pageUrl, {
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8'
      }
    })
    html = await r.text()
    if (r.status === 404) return fail(404, 'Lowongan tidak ditemukan atau sudah dihapus dari JobStreet.')
    if (!r.ok || /<title>Just a moment/i.test(html)) {
      return fail(502, 'JobStreet sedang menolak permintaan otomatis. Gunakan opsi "Tempel teks lowongan" sebagai gantinya.')
    }
  } catch (err) {
    return fail(502, 'Gagal menghubungi JobStreet: ' + (err?.message || 'koneksi bermasalah'))
  }

  const redux = extractReduxData(html)
  const result = redux?.jobdetails?.result
  const job = result?.job

  if (!job) {
    // Cadangan: meta tag Open Graph
    const ogTitle = metaContent(html, 'og:title')
    const ogDesc = metaContent(html, 'og:description')
    if (!ogTitle) return fail(422, 'Detail lowongan tidak bisa dibaca dari halaman JobStreet. Gunakan opsi "Tempel teks lowongan".')
    return {
      status: 200,
      body: {
        ok: true,
        partial: true,
        job: {
          id: jobId,
          url: pageUrl,
          title: ogTitle.replace(/\s*-\s*Jobstreet\s*$/i, '').replace(/\s+Job in\s+.*$/i, ''),
          company: '',
          location: '',
          salary: '',
          workType: '',
          descriptionText: ogDesc,
          bullets: []
        }
      }
    }
  }

  const contentHtml = job.content || job.content2 || ''
  return {
    status: 200,
    body: {
      ok: true,
      job: {
        id: job.id || jobId,
        url: pageUrl,
        title: job.title || '',
        company: job.advertiser?.name || '',
        location: job.location?.label || '',
        salary: job.salary?.label || '',
        workType: job.workTypes?.label || '',
        classification: job.classifications?.[0]?.label || '',
        workArrangement: result.workArrangements?.arrangements?.[0]?.label?.text || '',
        abstract: job.abstract || '',
        listedAt: job.listedAt?.dateTimeUtc || '',
        listedLabel: job.listedAt?.label || '',
        expiresAt: job.expiresAt?.dateTimeUtc || '',
        isExpired: Boolean(job.isExpired),
        isLinkOut: Boolean(job.isLinkOut),
        phone: job.phoneNumber || '',
        logo: job.products?.branding?.logo?.url || '',
        descriptionText: htmlToText(contentHtml),
        bullets: extractBullets(contentHtml)
      }
    }
  }
}
