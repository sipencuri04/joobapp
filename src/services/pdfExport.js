import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * 1. Export CV langsung ke PDF berbasis Teks Asli (Vector / Pure Text)
 * 100% Lolos ATS, teks dapat diseleksi & di-copy, tidak pecah di zoom berapa pun.
 */
export function exportCvToTextPdf(cvData = {}, filename = 'CV_Pelamar.pdf') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = 210
  const pageHeight = 297
  const margin = 16
  const contentWidth = pageWidth - (margin * 2) // 178mm
  let y = margin

  const checkPageBreak = (neededHeight) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage()
      y = margin
      return true
    }
    return false
  }

  // ── HEADER ──────────────────────────────────────────────────────────
  // Kiri: Nama Pelamar (Besar, Bold)
  doc.setFont('times', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(0, 0, 0)
  doc.text(cvData.fullName || 'Agung Setyawan', margin, y + 6)

  // Kanan: Kontak (Telepon, Email, Lokasi) - dibersihkan dari simbol kotor
  doc.setFont('times', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(30, 30, 30)
  const contactLines = []
  if (cvData.phone) {
    const cleanPhone = cvData.phone.replace(/^[\*\s•\-,]+/, '').replace(/[,;]+$/, '').trim()
    if (cleanPhone) contactLines.push(cleanPhone)
  }
  if (cvData.email) {
    const cleanEmail = cvData.email.replace(/^[\*\s•\-,]+/, '').replace(/[,;]+$/, '').trim()
    if (cleanEmail) contactLines.push(cleanEmail)
  }
  if (cvData.location) {
    const cleanLoc = cvData.location.replace(/^[\*\s•\-,]+/, '').replace(/[,;]+$/, '').trim()
    if (cleanLoc) contactLines.push(cleanLoc)
  }

  let contactY = y + 1.5
  for (const line of contactLines) {
    doc.text(line, pageWidth - margin, contactY, { align: 'right' })
    contactY += 4.8
  }

  y = Math.max(y + 14, contactY + 3)

  // Helper pembuat garis judul bagian (Section Heading)
  const addSectionTitle = (title) => {
    checkPageBreak(18)
    y += 2
    doc.setFont('times', 'bold')
    doc.setFontSize(11.5)
    doc.setTextColor(0, 0, 0)
    doc.text(title, margin, y)
    y += 1.8
    doc.setLineWidth(0.6)
    doc.setDrawColor(0, 0, 0)
    doc.line(margin, y, pageWidth - margin, y)
    y += 5.5
  }

  // ── 1. TENTANG SAYA ──────────────────────────────────────────────────
  if (cvData.aboutMe && cvData.aboutMe.trim()) {
    addSectionTitle('Tentang Saya')
    doc.setFont('times', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(20, 20, 20)
    const bioText = cvData.aboutMe.trim()
    const bioLines = doc.splitTextToSize(bioText, contentWidth)
    for (const bLine of bioLines) {
      checkPageBreak(5.2)
      doc.text(bLine, margin, y)
      y += 4.8
    }
    y += 2
  }

  // ── 2. PENDIDIKAN ────────────────────────────────────────────────────
  if (cvData.educationHeader) {
    addSectionTitle('Pendidikan')
    doc.setFont('times', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(0, 0, 0)
    checkPageBreak(6)
    doc.text(cvData.educationHeader.trim(), margin, y)
    y += 5

    if (cvData.educationDesc && cvData.educationDesc.trim()) {
      doc.setFont('times', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(20, 20, 20)
      const eduLines = doc.splitTextToSize(cvData.educationDesc.trim(), contentWidth)
      for (const eLine of eduLines) {
        checkPageBreak(5.2)
        doc.text(eLine, margin, y)
        y += 4.8
      }
    }
    y += 2
  }

  // ── 3. PENGALAMAN (PROYEK) ──────────────────────────────────────────
  if (Array.isArray(cvData.projects) && cvData.projects.length > 0) {
    addSectionTitle('Pengalaman')

    for (const proj of cvData.projects) {
      checkPageBreak(14)
      // Titik Bullet sejajar dengan judul
      doc.setFillColor(0, 0, 0)
      doc.circle(margin + 1.5, y - 1.2, 0.75, 'F')

      // Judul Proyek
      doc.setFont('times', 'bold')
      doc.setFontSize(10.5)
      doc.setTextColor(0, 0, 0)
      doc.text(`Project — ${proj.title || ''}`, margin + 5, y)
      y += 5

      // Deskripsi Proyek
      if (proj.description && proj.description.trim()) {
        doc.setFont('times', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(20, 20, 20)
        const descText = proj.description.trim()
        const descLines = doc.splitTextToSize(descText, contentWidth - 5)
        for (const dLine of descLines) {
          checkPageBreak(5.2)
          doc.text(dLine, margin + 5, y)
          y += 4.8
        }
      }
      y += 2.5
    }
  }

  // ── 4. REFERENSI ────────────────────────────────────────────────────
  if (cvData.reference && cvData.reference.name && cvData.reference.name.trim()) {
    addSectionTitle('Reference')
    doc.setFont('times', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(0, 0, 0)
    checkPageBreak(6)
    doc.text(cvData.reference.name.trim(), margin, y)
    y += 5

    doc.setFont('times', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(20, 20, 20)
    if (cvData.reference.position) {
      checkPageBreak(5.2)
      doc.text(cvData.reference.position.trim(), margin, y)
      y += 4.8
    }
    if (cvData.reference.phone) {
      checkPageBreak(5.2)
      doc.text(cvData.reference.phone.trim(), margin, y)
      y += 4.8
    }
  }

  doc.save(filename)
  return true
}

/**
 * 2. Export Surat Lamaran langsung ke PDF berbasis Teks Asli (Vector / Pure Text)
 * Format baku Times New Roman, rapi, dan resmi.
 */
export function exportCoverLetterToTextPdf(letterData = {}, filename = 'Surat_Lamaran.pdf') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = 210
  const pageHeight = 297
  const margin = 20
  const contentWidth = pageWidth - (margin * 2) // 170mm
  let y = margin

  const checkPageBreak = (neededHeight) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage()
      y = margin
      return true
    }
    return false
  }

  doc.setFont('times', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)

  // 1. Kota dan Tanggal (Kanan Atas)
  if (letterData.cityDate) {
    doc.text(letterData.cityDate, pageWidth - margin, y, { align: 'right' })
    y += 8
  }

  // 2. Perihal
  doc.text(`Perihal: Lamaran Pekerjaan – ${letterData.position || ''}`, margin, y)
  y += 7

  // 3. Penerima
  doc.text('Yth.', margin, y)
  y += 5.2
  doc.text(`Tim Rekrutmen ${letterData.company || ''}`, margin, y)
  y += 5.2
  doc.text(letterData.companyCity || 'Di Tempat', margin, y)
  y += 8

  // 4. Salam Pembuka
  doc.text('Dengan hormat,', margin, y)
  y += 6

  // 5. Pernyataan Awal
  doc.text('Saya yang bertanda tangan di bawah ini:', margin, y)
  y += 6

  // 6. Biodata Singkat
  const biodata = [
    { label: 'Nama', value: letterData.applicantName || '' },
    { label: 'Tempat, Tanggal Lahir', value: letterData.birthPlaceDate || '' },
    { label: 'Pendidikan', value: letterData.education || '' },
    { label: 'Domisili', value: letterData.domicile || '' },
    { label: 'No. HP/WhatsApp', value: letterData.phone || '' },
    { label: 'Email', value: letterData.email || '' }
  ]

  const col1X = margin
  const colColonX = margin + 44
  const col2X = margin + 47
  const col2Width = contentWidth - 47

  for (const item of biodata) {
    if (!item.value) continue
    checkPageBreak(5.5)
    doc.text(item.label, col1X, y)
    doc.text(':', colColonX, y)
    const valLines = doc.splitTextToSize(item.value, col2Width)
    doc.text(valLines[0], col2X, y)
    y += 5.2
    for (let i = 1; i < valLines.length; i++) {
      checkPageBreak(5.2)
      doc.text(valLines[i], col2X, y)
      y += 5.2
    }
  }

  y += 4

  // 7. Paragraf 1 (Kualifikasi & Pengalaman) - Render per-baris rapi
  if (letterData.bodyParagraph1) {
    const p1Text = `        ${letterData.bodyParagraph1.trim()}`
    const p1Lines = doc.splitTextToSize(p1Text, contentWidth)
    for (const line of p1Lines) {
      checkPageBreak(5.8)
      doc.text(line, margin, y)
      y += 5.2
    }
    y += 4
  }

  // 8. Paragraf 2 (Lampiran & Penutup) - Render per-baris rapi
  if (letterData.bodyParagraph2) {
    const p2Text = `        ${letterData.bodyParagraph2.trim()}`
    const p2Lines = doc.splitTextToSize(p2Text, contentWidth)
    for (const line of p2Lines) {
      checkPageBreak(5.8)
      doc.text(line, margin, y)
      y += 5.2
    }
    y += 6
  }

  // 9. Tanda Tangan
  const targetTtdY = Math.max(y + 14, pageHeight - margin - 35)
  if (targetTtdY + 28 > pageHeight - margin) {
    doc.addPage()
    y = margin + 10
  } else {
    y = targetTtdY
  }

  doc.text('Hormat saya,', margin, y)
  y += 22
  doc.text(letterData.applicantName || 'Pelamar', margin, y)

  doc.save(filename)
  return true
}

/**
 * 3. Cetak Dokumen via Browser Native Print (Simpan sebagai PDF)
 * Menggunakan iframe terisolasi agar hanya dokumen yang dicetak tanpa UI web.
 * Hasilnya 100% vektor teks murni dari mesin printer Chromium/browser.
 */
export function printDocument(elementId, title = 'Dokumen') {
  const el = document.getElementById(elementId)
  if (!el) {
    window.print()
    return
  }

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow.document
  doc.open()

  // Ambil semua stylesheet halaman saat ini
  let stylesHtml = ''
  document.querySelectorAll('link[rel="stylesheet"], style').forEach(node => {
    stylesHtml += node.outerHTML
  })

  doc.write(`
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        ${stylesHtml}
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          #${elementId} {
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            transform: none !important;
          }
          .no-print { display: none !important; }
        </style>
      </head>
      <body>
        ${el.outerHTML}
      </body>
    </html>
  `)
  doc.close()

  iframe.contentWindow.focus()
  setTimeout(() => {
    iframe.contentWindow.print()
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe)
      }
    }, 1500)
  }, 400)
}

/**
 * 4. Fallback: Ekspor via html2canvas (gambar raster ke PDF)
 */
export async function exportElementToPdf(elementId, filename = 'dokumen.pdf') {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error(`Elemen dengan ID #${elementId} tidak ditemukan.`)
  }

  const originalWidth = element.style.width
  element.style.width = '794px'

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(filename)
    return true
  } catch (err) {
    console.error('PDF generation error:', err)
    throw err
  } finally {
    element.style.width = originalWidth
  }
}
