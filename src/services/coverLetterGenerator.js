/**
 * Dynamic Cover Letter Generator & Field Matcher
 * Otomatis menyesuaikan isi surat lamaran formal berdasarkan bidang posisi, kualifikasi loker, dan profil pelamar.
 */

export const JOB_CATEGORIES = {
  DEV: {
    key: 'it_dev',
    label: 'Web & Software Development',
    keywords: [
      'web', 'developer', 'frontend', 'backend', 'fullstack', 'software', 
      'programmer', 'coding', 'vue', 'react', 'php', 'laravel', 'codeigniter', 
      'javascript', 'typescript', 'golang', 'mobile', 'flutter', 'android', 'ios'
    ]
  },
  INFRA: {
    key: 'it_infra',
    label: 'IT Support & Jaringan',
    keywords: [
      'it support', 'helpdesk', 'teknisi', 'hardware', 'network', 'jaringan', 
      'maintenance', 'troubleshoot', 'lan', 'wlan', 'cctv', 'printer', 'pc support', 'infrastruktur'
    ]
  },
  DATA_AI: {
    key: 'data_ai',
    label: 'Data, AI & Otomasi',
    keywords: [
      'data', 'python', 'ai', 'machine learning', 'artificial intelligence', 
      'analyst', 'analis data', 'automation', 'otomasi', 'deep learning', 'pandas'
    ]
  },
  ADMIN: {
    key: 'admin',
    label: 'Administrasi & Operasional',
    keywords: [
      'admin', 'administrasi', 'data entry', 'operasional', 'back office', 
      'tata usaha', 'arsip', 'dokumen', 'gudang', 'logistik', 'purchasing', 'clerk', 'office'
    ]
  },
  CREATIVE: {
    key: 'creative',
    label: 'Desain Grafis & Kreatif',
    keywords: [
      'design', 'desain', 'grafis', 'ui', 'ux', 'multimedia', 'video', 
      'editor', 'animasi', 'creative', 'kreatif', 'illustrator', 'photoshop', 'canva'
    ]
  },
  MARKETING: {
    key: 'marketing',
    label: 'Marketing & Penjualan',
    keywords: [
      'marketing', 'sales', 'penjualan', 'social media', 'media sosial', 
      'digital marketing', 'content creator', 'copywriter', 'seo', 'promosi', 'telemarketing'
    ]
  },
  FINANCE: {
    key: 'finance',
    label: 'Keuangan & Akuntansi',
    keywords: [
      'finance', 'keuangan', 'akuntansi', 'accounting', 'pajak', 'tax', 
      'kasir', 'audit', 'pembukuan', 'teller'
    ]
  },
  SERVICE: {
    key: 'service',
    label: 'Pelayanan & Customer Service',
    keywords: [
      'customer service', 'cs', 'front office', 'resepsionis', 'pelayanan', 
      'barista', 'waiter', 'pramusaji', 'hospitality', 'hotel', 'restoran', 'f&b'
    ]
  }
}

/**
 * Deteksi kategori/bidang pekerjaan berdasarkan judul posisi, kualifikasi, atau ringkasan
 */
export function detectJobCategory(jobTitle = '', requirements = [], summary = '') {
  const combinedText = `${jobTitle} ${requirements.join(' ')} ${summary}`.toLowerCase()

  for (const cat of Object.values(JOB_CATEGORIES)) {
    for (const kw of cat.keywords) {
      if (combinedText.includes(kw.toLowerCase())) {
        return cat
      }
    }
  }

  return {
    key: 'general',
    label: 'Umum / Profesional',
    keywords: []
  }
}

/**
 * Format tanggal hari ini dalam bahasa Indonesia
 */
export function formatIndonesianDate(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

/**
 * Buat Paragraf 1 (Inti Kualifikasi & Pengalaman) yang otomatis menyesuaikan bidang loker
 */
export function generateTailoredParagraph1(jobInfo = {}, applicantProfile = {}) {
  const jobTitle = jobInfo.jobTitle || 'posisi yang dilamar'
  const companyName = jobInfo.companyName || 'perusahaan'
  const requirements = Array.isArray(jobInfo.requirements) ? jobInfo.requirements : []
  const summary = jobInfo.summary || ''
  
  const category = detectJobCategory(jobTitle, requirements, summary)
  
  // Ambil pendidikan terbaik dari profile
  const education = (
    applicantProfile.educations?.[0]?.degree 
      ? `${applicantProfile.educations[0].degree} ${applicantProfile.educations[0].major || ''}`.trim()
      : null
  ) || applicantProfile.education || applicantProfile.headline || 'S1 Teknik Informatika'

  let paragraph = ''

  switch (category.key) {
    case 'admin':
      paragraph = `Saya memiliki latar belakang pendidikan ${education} dengan keterampilan dalam pengelolaan data, administrasi perkantoran, serta pengoperasian sistem informasi dan aplikasi komputer. Saya terbiasa melakukan pengarsipan dokumen, entri data dengan tingkat akurasi tinggi, serta koordinasi administratif guna mendukung kelancaran alur kerja internal. Saya memiliki etos kerja yang teliti, terstruktur, disiplin, dan mampu bekerja dengan cepat baik secara mandiri maupun dalam tim. Berbekal kualifikasi tersebut, saya siap memberikan kinerja terbaik dan kontribusi nyata dalam mendukung operasional sebagai ${jobTitle} di ${companyName}.`
      break

    case 'it_dev':
      paragraph = `Saya memiliki latar belakang pendidikan ${education} dan pengalaman praktis dalam perancangan serta pengembangan sistem informasi dan aplikasi berbasis web. Saya terbiasa melakukan analisis kebutuhan sistem, manajemen database (MySQL), dan pemrograman menggunakan teknologi seperti PHP, JavaScript, Vue.js, Laravel, CodeIgniter, hingga integrasi RESTful API. Saya terbiasa mengembangkan aplikasi secara terstruktur, memiliki kemampuan analisis dan problem solving yang kuat, serta antusias mempelajari teknologi baru. Saya sangat berharap dapat berkontribusi optimal sekaligus mengembangkan potensi melalui posisi ${jobTitle} di ${companyName}.`
      break

    case 'it_infra':
      paragraph = `Saya memiliki latar belakang pendidikan ${education} dengan keahlian teknis dalam instalasi, pemeliharaan (maintenance), dan penanganan kendala (troubleshooting) perangkat keras komputer, printer, CCTV, serta infrastruktur jaringan LAN/WLAN. Didukung pengalaman dalam implementasi sistem IT dan helpdesk, saya terbiasa memberikan dukungan teknis secara responsif, solutif, dan terorganisir demi memastikan keandalan sistem. Saya siap mendedikasikan keahlian saya guna menjaga kelancaran operasional teknologi informasi di ${companyName} sebagai ${jobTitle}.`
      break

    case 'data_ai':
      paragraph = `Saya memiliki latar belakang pendidikan ${education} dengan fokus keahlian pada pengolahan data menggunakan Python, eksplorasi model AI, dan otomasi alur kerja digital. Saya memiliki pengalaman dalam memproses dataset, analisis tren data, dan perancangan integrasi API untuk menghasilkan sistem yang efisien dan solutif. Dengan pola pikir analitis, ketelitian tinggi, dan antusiasme dalam mengimplementasikan teknologi data dan AI modern, saya siap berkontribusi optimal dalam mendukung inovasi di ${companyName} melalui posisi ${jobTitle}.`
      break

    case 'creative':
      paragraph = `Saya memiliki ketertarikan mendalam dan keterampilan dalam visualisasi kreatif, desain grafis, serta pengolahan konten multimedia. Saya terbiasa menerjemahkan konsep menjadi karya visual yang komunikatif, estetis, dan sesuai dengan identitas merek (branding) maupun kebutuhan target audiens. Saya memiliki kepekaan visual yang kuat terhadap tipografi, warna, dan layout, serta siap melampirkan portofolio karya kreatif saya. Saya bertekad memberikan ide-ide segar dan kontribusi visual terbaik bagi kemajuan ${companyName} sebagai ${jobTitle}.`
      break

    case 'marketing':
      paragraph = `Saya memiliki kemampuan komunikasi yang persuasif, pemahaman tentang dinamika pemasaran modern, serta pemanfaatan media digital dan platform sosial untuk meningkatkan visibilitas produk. Saya terbiasa menyusun pendekatan komunikasi yang relevan, membaca tren pasar, serta berorientasi pada pencapaian target kerja yang terukur. Dengan dedikasi tinggi, kemampuan interpersonal yang adaptif, dan semangat kerja sama tim, saya siap berkontribusi aktif dalam mendorong pertumbuhan dan citra positif ${companyName} untuk posisi ${jobTitle}.`
      break

    case 'finance':
      paragraph = `Saya memiliki latar belakang pendidikan ${education} dengan ketelitian tinggi dalam pengolahan data numerik, pencatatan administrasi keuangan, serta penyusunan rekapitulasi data berbasis aplikasi komputer. Saya terbiasa bekerja dengan integritas tinggi, teliti, rapi, dan konsisten mematuhi prosedur operasional yang berlaku. Dengan komitmen menjaga akurasi data dan kelancaran pencatatan, saya yakin dapat mendukung tertibnya operasional administrasi di ${companyName} sebagai ${jobTitle}.`
      break

    case 'service':
      paragraph = `Saya memiliki kemampuan komunikasi interpersonal yang sangat baik, sikap ramah, empati, dan komitmen tinggi dalam menghadirkan pelayanan prima (service excellence) kepada pelanggan. Saya terbiasa bekerja di lingkungan yang dinamis, cepat tanggap dalam memahami kebutuhan maupun menyelesaikan kendala pelanggan, serta menjaga standar layanan secara konsisten. Saya siap mendedikasikan keramahan dan profesionalisme saya untuk menciptakan pengalaman positif bagi setiap pelanggan di ${companyName} sebagai ${jobTitle}.`
      break

    default: // general
      paragraph = `Saya memiliki latar belakang pendidikan ${education} dengan motivasi kerja yang tinggi, kedisiplinan, serta kemampuan adaptasi yang cepat di lingkungan kerja baru. Saya memiliki rekam jejak kerja yang bertanggung jawab dan kemampuan komunikasi serta kolaborasi yang baik, baik saat bekerja mandiri maupun dalam tim. Berbekal komitmen kuat untuk terus belajar dan memberikan performa terbaik, saya siap mendedikasikan kemampuan dan tenaga saya guna mendukung pencapaian target di ${companyName} sebagai ${jobTitle}.`
      break
  }

  // Jika ada syarat spesifik dari lowongan, tambahkan penguat relevansi (jika belum ada)
  if (requirements.length > 0 && requirements.length <= 4) {
    const cleanReqs = requirements.slice(0, 2).map(r => r.replace(/^[-•*]\s*/, '').trim()).filter(Boolean).join(' serta ')
    if (cleanReqs && !paragraph.toLowerCase().includes(cleanReqs.toLowerCase())) {
      paragraph += ` Kualifikasi saya juga sejalan dengan persyaratan yang dicantumkan, khususnya terkait ${cleanReqs}.`
    }
  }

  return paragraph
}

/**
 * Buat Paragraf 2 (Lampiran & Penutup)
 */
export function generateTailoredParagraph2() {
  return 'Sebagai bahan pertimbangan Bapak/Ibu, saya siap melampirkan Curriculum Vitae (CV), portofolio, dan dokumen pendukung lainnya. Besar harapan saya untuk diberikan kesempatan menghadiri sesi wawancara agar dapat menjelaskan kualifikasi dan potensi kontribusi saya secara lebih mendalam. Demikian surat lamaran ini saya sampaikan, atas perhatian dan kesempatan yang diberikan, saya ucapkan terima kasih.'
}

/**
 * Format teks lengkap surat lamaran formal standar Indonesia
 */
export function formatFullCoverLetterText(letterData) {
  return `${letterData.cityDate || ''}

Perihal: Lamaran Pekerjaan – ${letterData.position || 'Posisi'}

Yth.
Tim Rekrutmen ${letterData.company || 'Perusahaan'}
${letterData.companyCity || 'Di Tempat'}

Dengan hormat,

Saya yang bertanda tangan di bawah ini:
Nama                  : ${letterData.applicantName || ''}
Tempat, Tanggal Lahir : ${letterData.birthPlaceDate || ''}
Pendidikan            : ${letterData.education || ''}
Domisili              : ${letterData.domicile || ''}
No. HP/WhatsApp       : ${letterData.phone || ''}
Email                 : ${letterData.email || ''}

    ${letterData.bodyParagraph1 || ''}

    ${letterData.bodyParagraph2 || ''}

Hormat saya,



${letterData.applicantName || ''}`
}

/**
 * Buat pesan WhatsApp lamaran kerja yang santun, ringkas, dan sangat natural (human-like)
 */
export function generateNaturalWhatsAppMessage(jobInfo = {}, applicantProfile = {}) {
  const company = jobInfo.companyName ? ` ${jobInfo.companyName}` : ''
  const position = jobInfo.jobTitle || 'posisi yang dibuka'
  const name = applicantProfile.fullName || 'Agung Setyawan'

  const category = detectJobCategory(position, jobInfo.requirements || [], jobInfo.summary || '')

  let background = 'di bidang IT dan Teknik Informatika'
  if (applicantProfile.headline && applicantProfile.headline.trim()) {
    const hl = applicantProfile.headline.replace(/^mahasiswa (akhir )?/i, '').trim()
    if (hl) background = `di bidang ${hl}`
  }

  let experience = 'pengembangan sistem, jaringan komputer, maintenance, serta troubleshooting perangkat'
  switch (category.key) {
    case 'it_infra':
      experience = 'pengembangan sistem, jaringan komputer, maintenance, serta troubleshooting perangkat'
      break
    case 'it_dev':
      experience = 'pengembangan sistem web, pengelolaan database, integrasi API, serta implementasi aplikasi'
      break
    case 'data_ai':
      experience = 'pengolahan data menggunakan Python, analisis data, integrasi API, serta otomatisasi sistem'
      break
    case 'admin':
      experience = 'administrasi perkantoran, pengolahan data dokumen, pengarsipan, serta pengoperasian sistem komputer'
      break
    case 'creative':
      experience = 'desain grafis, pembuatan konten visual, multimedia, serta penerjemahan konsep kreatif'
      break
    case 'marketing':
      experience = 'komunikasi pemasaran, pengelolaan media sosial, pembuatan konten promosi, serta strategi penjualan'
      break
    case 'finance':
      experience = 'administrasi keuangan, pencatatan transaksi, pengolahan data numerik, dan penyusunan rekapitulasi data'
      break
    case 'service':
      experience = 'pelayanan pelanggan, komunikasi ramah, penanganan kebutuhan konsumen, dan operasional layanan'
      break
    default:
      experience = 'administrasi, kerja sama tim, adaptasi cepat, serta penyelesaian tugas secara terstruktur dan disiplin'
      break
  }

  return `Selamat pagi Bapak/Ibu HRD${company}. Perkenalkan, saya ${name}, memiliki latar belakang ${background}.

Saya tertarik melamar posisi ${position}. Saya memiliki pengalaman dalam ${experience}.

CV saya lampirkan sebagai bahan pertimbangan. Terima kasih atas waktu dan kesempatannya, Bapak/Ibu. 🙏`
}
