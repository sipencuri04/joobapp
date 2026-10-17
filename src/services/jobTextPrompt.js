// Prompt bersama untuk menganalisis TEKS lowongan (dari link JobStreet / teks yang ditempel)
export function buildJobTextPrompt(jobText) {
  return `
Analisis teks lowongan pekerjaan berikut dengan teliti.
TARGET PELAMAR: Lulusan S1 Teknik Informatika (keahlian: IT Support, Web Development, Programming, Jaringan & Hardware, Troubleshooting PC/CCTV/Jaringan, Pengolahan Data, Sistem Informasi).

Jika teks berbahasa Inggris, tetap tulis "requirements", "responsibilities" dan "summary" dalam BAHASA INDONESIA yang ringkas.
Jika ada beberapa posisi, masukkan semuanya ke "availablePositions" dan pilih yang paling relevan untuk lulusan Teknik Informatika sebagai "jobTitle".

Kembalikan HANYA JSON valid tanpa kata pengantar:
{
  "companyName": "Nama perusahaan",
  "jobTitle": "Nama posisi",
  "availablePositions": ["Posisi 1"],
  "email": "Email rekruter jika tertulis di teks, jika tidak ada isi ''",
  "phone": "Nomor WhatsApp/telepon jika tertulis di teks, jika tidak ada isi ''",
  "location": "Nama kota penempatan saja (e.g. 'Jakarta'), kosongkan jika tidak jelas",
  "employmentType": "Full Time / Part Time / Internship / Kontrak",
  "salary": "Range gaji jika ada, atau 'Tidak disebutkan'",
  "deadline": "Batas akhir jika ada, atau '-'",
  "requirements": ["Kualifikasi / syarat (maks 8, ringkas)"],
  "responsibilities": ["Tanggung jawab utama (maks 6, ringkas)"],
  "skillsRequired": ["Skill/tools teknis yang disebut (maks 10)"],
  "summary": "Ringkasan lowongan 2-3 kalimat bahasa Indonesia"
}

JANGAN mengarang email atau nomor telepon yang tidak tertulis di teks.

=== TEKS LOWONGAN ===
${String(jobText).slice(0, 12000)}
`
}
