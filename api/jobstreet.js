// Vercel Serverless Function: GET /api/jobstreet?url=<link lowongan JobStreet>
import { fetchJobstreetJob } from './_jobstreet-core.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }
  const input = (req.query && req.query.url) || ''
  const { status, body } = await fetchJobstreetJob(String(input))
  if (status === 200) {
    // Cache di edge Vercel 1 jam agar link yang sama tidak di-fetch berulang
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
  }
  return res.status(status).json(body)
}
