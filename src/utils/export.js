import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { safeFilename } from './format.js';

export function exportWorkbook(title, headers, rows, filename = title) {
  const worksheet = XLSX.utils.aoa_to_sheet([[title], [], headers, ...rows]);
  worksheet['!cols'] = headers.map((header, index) => ({
    wch: Math.min(55, Math.max(String(header).length + 2, ...rows.map((row) => String(row[index] ?? '').length + 2))),
  }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  XLSX.writeFile(workbook, `${safeFilename(filename)}.xlsx`);
}

export async function exportElementPdf(element, filename, title) {
  if (!element) return;
  const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#111c31', useCORS: true });
  const landscape = canvas.width >= canvas.height;
  const pdf = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 24;
  let top = margin;
  if (title) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text(String(title), margin, top + 4);
    top += 18;
  }
  const availableWidth = pageWidth - margin * 2;
  const availableHeight = pageHeight - top - margin;
  const scale = availableWidth / canvas.width;
  const sliceHeight = Math.floor(availableHeight / scale);
  let sourceY = 0;
  let first = true;
  while (sourceY < canvas.height) {
    if (!first) { pdf.addPage(); top = margin; }
    const height = Math.min(sliceHeight, canvas.height - sourceY);
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = height;
    pageCanvas.getContext('2d').drawImage(canvas, 0, sourceY, canvas.width, height, 0, 0, canvas.width, height);
    pdf.addImage(pageCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', margin, top, availableWidth, height * scale);
    sourceY += height;
    first = false;
  }
  pdf.save(`${safeFilename(filename)}.pdf`);
}
