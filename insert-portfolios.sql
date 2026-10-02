-- ==============================================================================
-- AutoApply Pro - INSERT Portofolio Proyek
-- Jalankan file ini di Supabase SQL Editor untuk menambahkan 4 proyek portofolio.
-- Pastikan tabel 'profiles' dan 'portfolios' sudah dibuat terlebih dahulu.
-- ==============================================================================

DO $$
DECLARE
    v_profile_id UUID;
BEGIN
    -- Ambil profile_id pertama yang ada di tabel profiles
    SELECT id INTO v_profile_id FROM public.profiles ORDER BY updated_at DESC LIMIT 1;

    -- Jika belum ada profil sama sekali, buat profil awal dulu
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

        RAISE NOTICE 'Profil baru dibuat dengan id = %', v_profile_id;
    ELSE
        RAISE NOTICE 'Menggunakan profil yang sudah ada, id = %', v_profile_id;
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
    -- 2. Sistem Inventory & Asset Management — Grand Artos
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
    -- 4. Sistem Blasting Plan — AKP
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

    RAISE NOTICE 'Selesai: 4 proyek portofolio berhasil ditambahkan untuk profile_id = %', v_profile_id;
END $$;
