import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export async function exportElementToPdf(elementId, filename = 'dokumen.pdf') {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error(`Elemen dengan ID #${elementId} tidak ditemukan.`)
  }

  // Temporary styling adjustments for crisp capture
  const originalWidth = element.style.width
  element.style.width = '794px' // Standard A4 width at 96 DPI

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution
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
