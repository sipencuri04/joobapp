-- ==============================================================================
-- AutoApply Pro - Supabase SQL Schema
-- Copy and run this in your Supabase Project > SQL Editor
-- ==============================================================================

-- 1. Profiles Table (Data Diri & Info Kontak)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    headline TEXT,
    email TEXT,
    phone TEXT,
    location TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    bio TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Work Experiences (Pengalaman Kerja)
CREATE TABLE IF NOT EXISTS public.experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    location TEXT,
    start_date TEXT,
    end_date TEXT,
    is_current BOOLEAN DEFAULT false,
    description TEXT,
    skills_used TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Educations (Pendidikan)
CREATE TABLE IF NOT EXISTS public.educations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    institution TEXT NOT NULL,
    degree TEXT,
    major TEXT,
    graduation_year TEXT,
    gpa TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Skills (Keahlian)
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT DEFAULT 'Technical', -- Technical, Soft Skill, Tools, Languages
    name TEXT NOT NULL,
    proficiency_level TEXT DEFAULT 'Advanced',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Portfolio Items (Portofolio & Proyek)
CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT,
    description TEXT,
    technologies TEXT[],
    demo_url TEXT,
    repo_url TEXT,
    thumbnail_url TEXT,
    featured BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Templates (Template Surat Lamaran & Pesan)
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'cover_letter', 'wa_message', 'email_body'
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Job Applications (Riwayat Lamaran Pekerjaan)
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    company_name TEXT NOT NULL,
    position_title TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    status TEXT DEFAULT 'Applied', -- 'Draft', 'Applied', 'Interview', 'Offered', 'Rejected'
    job_description TEXT,
    requirements TEXT[],
    screenshot_url TEXT,
    tailored_cover_letter TEXT,
    tailored_cv_data JSONB,
    selected_portfolio_ids UUID[],
    channel_used TEXT, -- 'gmail', 'whatsapp', 'website', 'other'
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    notes TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Allow public access for single-user personal app (or authenticated users)
CREATE POLICY "Allow all actions for anon users" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions for anon users" ON public.experiences FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions for anon users" ON public.educations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions for anon users" ON public.skills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions for anon users" ON public.portfolios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions for anon users" ON public.templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all actions for anon users" ON public.applications FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- INSERT: Data Portofolio Proyek
-- Jalankan ini SETELAH tabel profiles sudah ada dan ada setidaknya 1 profil.
-- Ganti nilai 'profile_id' di bawah dengan UUID profil Anda.
-- Cara dapat UUID profil: SELECT id FROM public.profiles LIMIT 1;
-- ==============================================================================

-- Simpan UUID profil Anda ke variabel sementara agar mudah digunakan ulang
DO $$
DECLARE
    v_profile_id UUID;
BEGIN
    -- Ambil profile_id pertama yang ada (atau ganti dengan UUID spesifik Anda)
    SELECT id INTO v_profile_id FROM public.profiles ORDER BY updated_at DESC LIMIT 1;

    -- Jika belum ada profil, buat dulu profil awal
    IF v_profile_id IS NULL THEN
        INSERT INTO public.profiles (full_name, headline, email, phone, location, bio, updated_at)
        VALUES (
            'Nama Anda',
            'Full Stack Web Developer',
            'email@gmail.com',
            '08xxxxxxxxxx',
            'Kota, Indonesia',
            'Web developer berpengalaman di bidang aplikasi enterprise berbasis PHP CodeIgniter dan MySQL.',
            now()
        )
        RETURNING id INTO v_profile_id;
    END IF;

    -- ==========================================================================
    -- 1. Sistem Invoice
    -- ==========================================================================
    INSERT INTO public.portfolios (
        profile_id, title, category, description,
        technologies, demo_url, repo_url, thumbnail_url, featured
    ) VALUES (
        v_profile_id,
        'Sistem Invoice',
        'Web Application',
        'Sistem berbasis web untuk membantu proses pembuatan, pencatatan, dan monitoring invoice secara terstruktur. Fitur meliputi pembuatan invoice otomatis dengan nomor unik, manajemen klien, status pembayaran, dan laporan rekap per periode.',
        ARRAY['PHP', 'CodeIgniter', 'MySQL', 'Bootstrap'],
        NULL,
        NULL,
        NULL,
        true
    );

    -- ==========================================================================
    -- 2. Sistem Inventory & Asset – Grand Artos
    -- ==========================================================================
    INSERT INTO public.portfolios (
        profile_id, title, category, description,
        technologies, demo_url, repo_url, thumbnail_url, featured
    ) VALUES (
        v_profile_id,
        'Sistem Inventory & Asset Management — Grand Artos',
        'Web Application',
        'Sistem berbasis web untuk mengelola inventaris dan aset secara menyeluruh, meliputi data barang, stok, peminjaman, pengembalian, dan monitoring aset secara real-time. Dikembangkan untuk kebutuhan internal Grand Artos.',
        ARRAY['PHP', 'CodeIgniter', 'MySQL', 'Bootstrap'],
        NULL,
        NULL,
        NULL,
        true
    );

    -- ==========================================================================
    -- 3. Sistem Absensi Face Recognition
    -- ==========================================================================
    INSERT INTO public.portfolios (
        profile_id, title, category, description,
        technologies, demo_url, repo_url, thumbnail_url, featured
    ) VALUES (
        v_profile_id,
        'Sistem Absensi Face Recognition',
        'Attendance System',
        'Sistem absensi berbasis web yang mengintegrasikan teknologi pengenalan wajah (face recognition) untuk mencatat dan memonitor kehadiran karyawan secara otomatis, akurat, dan real-time tanpa perlu absensi manual.',
        ARRAY['PHP', 'JavaScript', 'MySQL', 'Face Recognition API'],
        NULL,
        NULL,
        NULL,
        true
    );

    -- ==========================================================================
    -- 4. Sistem Blasting Plan – AKP
    -- ==========================================================================
    INSERT INTO public.portfolios (
        profile_id, title, category, description,
        technologies, demo_url, repo_url, thumbnail_url, featured
    ) VALUES (
        v_profile_id,
        'Sistem Blasting Plan — AKP',
        'Web Application',
        'Sistem berbasis web untuk membantu pengelolaan dan penyusunan data blasting plan secara terstruktur dan terdokumentasi. Dikembangkan untuk PT AKP guna mendukung efisiensi perencanaan operasional tambang.',
        ARRAY['PHP', 'CodeIgniter', 'MySQL', 'Bootstrap'],
        NULL,
        NULL,
        NULL,
        true
    );

    RAISE NOTICE 'Berhasil: 4 proyek portofolio ditambahkan untuk profile_id = %', v_profile_id;
END $$;

-- ==============================================================================
-- 6. App Settings (Menyimpan API Key Groq/Gemini & Konfigurasi di Cloud Database)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.app_settings;
CREATE POLICY "Allow all" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

-- Masukkan Groq API Key Anda sendiri di sini (opsional)
-- INSERT INTO public.app_settings (key, value)
-- VALUES 
--     ('groq_api_key', 'ISI_API_KEY_GROQ_ANDA_DISINI'),
--     ('ai_provider', 'groq')
-- ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

