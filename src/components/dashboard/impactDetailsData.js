import { jsPDF } from 'jspdf';
import { COLORS } from '../../constants.js';
import { effectiveImpact, activeCommunicationIssues } from '../../utils/analytics.js';
import { exportWorkbook } from '../../utils/export.js';
import { cleanText, formatNumber, formatPercent, safeFilename } from '../../utils/format.js';

export const impactTypes = {
  bd: { title: 'Inverter Breakdown', noun: 'inverters under breakdown', key: 'bd_cnt', textKey: 'bd_txt', color: COLORS.warn, impact: ['bd_cnt', 'inv_bd_impact'], impactLabel: 'Breakdown impact' },
  string: { title: 'String Breakdown', noun: 'strings down', key: 'str_cnt', textKey: 'str_txt', color: COLORS.pink, impact: ['str_cnt', 'str_impact'], impactLabel: 'String impact' },
  comms: { title: 'Comms / Potential', noun: 'communication issues', key: 'comms_cnt', textKey: 'comms_txt', color: COLORS.cyan, impact: ['comms_cnt', 'pot_impact'], impactLabel: 'Comms impact' },
  mpptSpikes: { title: 'MPPT Spikes', noun: 'MPPT spikes', key: 'mppt_spikes', color: COLORS.purple },
  mppt: { title: 'Potential RSD Failures', noun: 'potential RSD failures', key: 'mppt_cnt', textKey: 'mppt_txt', color: COLORS.good },
  spare: { title: 'Spare MPPT', noun: 'spare MPPTs', key: 'spare_mppt', color: '#94a3b8' },
};

export function impactValue(site, config) {
  return config.impact ? effectiveImpact(site, ...config.impact) : null;
}

export function siteIssueCount(site, config) {
  if (config === impactTypes.bd && Array.isArray(site.breakdownInverters)) return site.breakdownInverters.length;
  if (config === impactTypes.comms && Array.isArray(site.communicationIssues)) return activeCommunicationIssues(site).length;
  return Number(site[config.key]) || 0;
}

export function issueItems(site, config) {
  if (config === impactTypes.bd && Array.isArray(site.breakdownInverters) && site.breakdownInverters.length) {
    return site.breakdownInverters.map((item) => ({ text: String(item.name || 'Inverter'), impact: Number(item.impact) > 0 ? Number(item.impact) : null }));
  }
  if (config === impactTypes.comms && Array.isArray(site.communicationIssues) && site.communicationIssues.length) {
    return activeCommunicationIssues(site).map((item) => ({ text: String(item.text || 'Communication issue'), impact: Number(item.impact) > 0 ? Number(item.impact) : null }));
  }
  const raw = config.textKey ? cleanText(site[config.textKey]) : '';
  return raw ? raw.split(/\s*\|\s*|\r?\n/).filter((text) => config !== impactTypes.comms || !/\b(?:restored|resolved|rectified|recovered|now communicating|communication restored|back online|fixed)\b/i.test(text)).map((text) => ({ text: text.trim().replace(/\s+is under breakdown\s*$/i, ''), impact: null })).filter((item) => item.text) : [];
}

export function impactSummary(sites, config) {
  const count = sites.reduce((sum, site) => sum + siteIssueCount(site, config), 0);
  const values = config.impact ? sites.map((site) => impactValue(site, config)) : [];
  return { count, siteCount: sites.length, average: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null, max: values.length ? Math.max(...values) : null, maxCount: sites.length ? Math.max(...sites.map((site) => siteIssueCount(site, config))) : 0 };
}

export function exportImpactExcel(sites, config) {
  const rows = sites.flatMap((site) => {
    const items = issueItems(site, config);
    return (items.length ? items : [{ text: '', impact: null }]).map(({ text, impact }) => [site.site, siteIssueCount(site, config), config.impact ? formatPercent(impactValue(site, config)) : '', text, impact == null ? '' : formatPercent(impact), site.dc || 0]);
  });
  exportWorkbook(`${config.title} by Site`, ['Site', 'Site Issue Count', 'Site Impact', 'Issue Detail', 'Item Impact', 'DC (kW)'], rows, config.title);
}

export function exportImpactPdf(sites, config) {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const summary = impactSummary(sites, config);
  let y = 43;
  const write = (text, size = 10, bold = false) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal'); pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(String(text), 515);
    if (y + lines.length * (size + 4) > 790) { pdf.addPage(); y = 43; }
    pdf.text(lines, 40, y); y += lines.length * (size + 4) + 3;
  };
  write(`${config.title} (${formatNumber(summary.count)})`, 16, true);
  write(`${formatNumber(summary.count)} ${config.noun} across ${summary.siteCount} sites`);
  if (config.impact) write(`Average site impact: ${formatPercent(summary.average)}   Maximum site impact: ${formatPercent(summary.max)}`);
  y += 10;
  sites.forEach((site) => {
    if (y > 690) { pdf.addPage(); y = 43; }
    write(`${site.site} - ${formatNumber(siteIssueCount(site, config))} issue(s)${config.impact ? ` - ${formatPercent(impactValue(site, config))} impact` : ''}`, 11, true);
    const items = issueItems(site, config);
    items.forEach((item) => write(`  > ${item.text}${item.impact == null ? '' : ` - ${formatPercent(item.impact)}`}`));
    if (!items.length) write('  Individual issue details were not provided in the uploaded data.');
    y += 7;
  });
  pdf.save(`${safeFilename(config.title)}.pdf`);
}
