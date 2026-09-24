import { jsPDF } from 'jspdf';
import { exportWorkbook } from '../../utils/export.js';
import { cleanText, formatNumber, formatPercent, safeFilename } from '../../utils/format.js';

export function stringAvailability(site) {
  const total = Number(site.total_strings) || 0;
  const down = Math.max(0, Number(site.str_cnt) || 0);
  return total > 0 ? Math.max(0, 1 - down / total) : Math.max(0, 1 - (Number(site.str_impact) || 0));
}

export function inverterBreakdown(site) {
  const groups = new Map();
  cleanText(site.str_txt).split(/\s*\|\s*|\n/).forEach((entry) => {
    const match = entry.match(/^\s*(inv(?:erter)?\.?\s*\d+)[^:]*:\s*(\d+)\s*strings?\s*down/i);
    if (!match) return;
    const label = match[1].toUpperCase().replace(/^INVERTER\s*/, 'INV ');
    groups.set(label, (groups.get(label) || 0) + Number(match[2]));
  });
  return [...groups].map(([label, count]) => ({ label, count }));
}

export function exportStringExcel(sites) {
  exportWorkbook('String Availability by Site', ['Site', 'Availability', 'Strings Up', 'Total Strings', 'Strings Down', 'Inverters', 'DC (kW)', 'Inverter Breakdown'], sites.map((site) => [
    site.site, formatPercent(stringAvailability(site)), site.total_strings > 0 ? Math.max(0, site.total_strings - (Number(site.str_cnt) || 0)) : '', site.total_strings || '', site.str_cnt || 0, site.tot_inv || 0, site.dc || 0,
    inverterBreakdown(site).map(({ label, count }) => `${label}: ${count} down`).join('; ') || cleanText(site.str_txt),
  ]), 'StringAvailability');
}

export function exportStringPdf(sites) {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  let y = 44;
  const write = (text, size = 10, bold = false) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal'); pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(String(text), 515);
    if (y + lines.length * (size + 4) > 790) { pdf.addPage(); y = 42; }
    pdf.text(lines, 40, y); y += lines.length * (size + 4) + 3;
  };
  write(`String Availability by Site (${sites.length})`, 16, true);
  y += 10;
  sites.forEach((site) => {
    if (y > 700) { pdf.addPage(); y = 42; }
    write(`${site.site}  |  ${formatPercent(stringAvailability(site))}`, 11, true);
    write(`Strings up ${site.total_strings > 0 ? `${formatNumber(Math.max(0, site.total_strings - (Number(site.str_cnt) || 0)))} / ${formatNumber(site.total_strings)}` : 'N/A'}  |  Down ${formatNumber(site.str_cnt)}  |  Inverters ${formatNumber(site.tot_inv)}  |  DC ${formatNumber(site.dc)} kW`);
    const breakdown = inverterBreakdown(site);
    breakdown.forEach(({ label, count }) => write(`  ${label}: ${count} string${count === 1 ? '' : 's'} down`));
    if (!breakdown.length && cleanText(site.str_txt)) write(`  ${cleanText(site.str_txt)}`);
    y += 8;
  });
  pdf.save(`${safeFilename('StringAvailability')}.pdf`);
}

