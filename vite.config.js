import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { fetchJobstreetJob } from './api/_jobstreet-core.js'

// Saat `npm run dev`, layani /api/jobstreet langsung dari Vite
// (di produksi ditangani Vercel Function api/jobstreet.js)
function devApiPlugin() {
  return {
    name: 'dev-api-jobstreet',
    configureServer(server) {
      server.middlewares.use('/api/jobstreet', async (req, res) => {
        const url = new URL(req.url, 'http://localhost').searchParams.get('url') || ''
        const { status, body } = await fetchJobstreetJob(url)
        res.statusCode = status
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify(body))
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), devApiPlugin()],
})
