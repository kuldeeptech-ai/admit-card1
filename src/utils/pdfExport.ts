import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfExportOptions {
  fileName?: string;
  orientation?: 'portrait' | 'landscape';
  onProgress?: (current: number, total: number, status: string) => void;
}

export async function downloadAdmitCardsPdf(
  containerSelector: string,
  options: PdfExportOptions = {}
): Promise<void> {
  const {
    fileName = 'Admit_Cards_A4.pdf',
    onProgress,
  } = options;

  const pageElements = document.querySelectorAll(`${containerSelector} .a4-page`);
  if (!pageElements || pageElements.length === 0) {
    throw new Error('No printable A4 sheets found in view.');
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const totalPages = pageElements.length;

  for (let i = 0; i < totalPages; i++) {
    const pageEl = pageElements[i] as HTMLElement;

    if (onProgress) {
      onProgress(i + 1, totalPages, `Rendering A4 Sheet ${i + 1} of ${totalPages}...`);
    }

    // Capture using html2canvas with high scale for ultra-crisp print quality
    const canvas = await html2canvas(pageEl, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: pageEl.scrollWidth,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    if (i > 0) {
      pdf.addPage('a4', 'portrait');
    }

    // A4 dimensions in mm: 210 x 297
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
  }

  if (onProgress) {
    onProgress(totalPages, totalPages, 'Finalizing PDF download...');
  }

  pdf.save(fileName);
}

export function triggerPrintSheet(selector = '.a4-sheets-wrapper', orientation = 'portrait'): void {
  // Use direct window.print() after a brief tick to allow DOM to be steady
  setTimeout(() => {
    window.print();
  }, 150);
}
