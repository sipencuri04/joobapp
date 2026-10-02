# AutoApply Pro 🚀
### AI Job Application Copilot (Vue 3 + Supabase + Vercel + Tailwind CSS)

Sistem asisten otomatis untuk mempermudah melamar pekerjaan:
1. **Multimodal AI Vision & OCR**: Upload atau paste (**Ctrl+V**) gambar tangkapan layar (screenshot) brosur/poster lowongan kerja.
2. **Auto-Detect Kontak Rekruter**: Otomatis mendeteksi alamat email (khususnya @gmail.com atau domain perusahaan) serta nomor telepon / WhatsApp rekruter.
3. **Smart Document Tailoring**: AI menyesuaikan Surat Lamaran (Cover Letter), CV ATS, dan memilih portofolio proyek Anda yang paling cocok dengan lowongan tersebut.
4. **Pengiriman Cepat (One-Click Actions)**:
   - **Buka Gmail Web Compose**: Membuka tab compose Gmail dengan To, Subject, dan Body surat lamaran yang sudah terisi rapi.
   - **Chat WhatsApp Langsung**: Membuka WhatsApp Web / App dengan pesan perkenalan & pitch profesional yang siap dikirim.
   - **Export PDF (A4)**: Unduh Surat Lamaran dan CV yang sudah dioptimasi untuk dilampirkan.
5. **Job Application Tracker**: Riwayat seluruh lamaran yang telah dikirim, lengkap dengan status (Draft, Applied, Interview, Offered, Rejected) dan catatan follow-up.
6. **Master Profile, CV & Portofolio**: Kelola data diri, keahlian, pengalaman kerja, portofolio, dan template dasar secara fleksibel.

---

## 🛠️ Tech Stack
- **Frontend**: Vue 3 (Composition API) + Vite
- **Styling**: Tailwind CSS + Google Fonts (Plus Jakarta Sans) + Glassmorphism
- **Icons**: Lucide Icons
- **State Management**: Pinia
- **Routing**: Vue Router 4 (HTML5 History Mode)
- **AI Engine**: Google Gemini API (Multimodal Vision `gemini-2.5-flash` / `gemini-1.5-flash`)
- **Database & Storage**: Supabase (PostgreSQL with RLS) + LocalStorage Fallback/Sync
- **PDF Generation**: jsPDF + html2canvas
- **Deployment**: Vercel ready (disertakan `vercel.json` SPA rewrites)

---

## 🚀 Cara Menjalankan Secara Lokal

1. Clone atau buka direktori proyek:
   ```bash
   cd JOOBAPP
   ```

2. Install dependensi (sudah terinstall):
   ```bash
   npm install
   ```

3. Jalankan server pengembangan lokal:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:5173/`.

4. Untuk build produksi:
   ```bash
   npm run build
   ```

---

## 🔑 Konfigurasi Google Gemini API (Gratis)

1. Buka [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Klik tombol **"Create API Key"**.
3. Buka aplikasi web AutoApply Pro, masuk ke menu **Pengaturan**, dan paste API Key Anda di kolom Google Gemini API.
4. Klik **Simpan Semua Pengaturan**.

> **Tips:** Anda juga dapat mencoba aplikasi tanpa API key menggunakan tombol **"Coba Contoh Lowongan (Demo)"** di halaman utama!

---

## 🗄️ Konfigurasi Supabase (Database & Cloud Sync)

1. Buka [Supabase](https://supabase.com) dan buat project baru.
2. Di dashboard Supabase, buka menu **SQL Editor**.
3. Buka file [`supabase-schema.sql`](./supabase-schema.sql) dari proyek ini, salin seluruh kodenya, dan paste ke SQL Editor Supabase, lalu jalankan (**Run**).
4. Buka **Project Settings** > **API** di Supabase, lalu salin:
   - **Project URL**
   - **anon / public Key**
5. Masukkan URL dan Key tersebut di menu **Pengaturan** aplikasi AutoApply Pro, lalu klik **Uji Koneksi Supabase** dan **Simpan**.

---

## ☁️ Cara Deploy ke Vercel

1. Push repository ini ke GitHub / GitLab.
2. Buka dashboard [Vercel](https://vercel.com) dan klik **Add New** > **Project**.
3. Import repository Anda.
4. Konfigurasi build setting:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. (Opsional) Masukkan Environment Variables di Vercel:
   - `VITE_GEMINI_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   *(Atau pengguna dapat mengisinya langsung melalui UI Pengaturan di browser).*
6. Klik **Deploy**. Selesai!
