-- ==============================================================================
-- AutoApply Pro: Simpan API Key & Konfigurasi ke Database Supabase
-- Jalankan query ini di Supabase > SQL Editor
-- ==============================================================================

-- 1. Buat tabel app_settings jika belum ada
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Aktifkan Row Level Security (RLS) dan izinkan akses
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON public.app_settings;
CREATE POLICY "Allow all" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

-- 3. Masukkan Groq API Key Anda sendiri di sini (opsional)
-- INSERT INTO public.app_settings (key, value)
-- VALUES 
--     ('groq_api_key', 'ISI_API_KEY_GROQ_ANDA_DISINI'),
--     ('ai_provider', 'groq')
-- ON CONFLICT (key) DO UPDATE 
-- SET value = EXCLUDED.value, updated_at = now();

SELECT * FROM public.app_settings;
