import { useState } from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Typography } from '@mui/material';
import { COLORS } from '../../constants.js';
import { effectiveImpact, siteStringAvailability } from '../../utils/analytics.js';
import { exportWorkbook } from '../../utils/export.js';
import { cleanText, formatNumber, formatPercent } from '../../utils/format.js';
import StringAvailabilityDetails from './StringAvailabilityDetails.jsx';
import { exportStringExcel, exportStringPdf } from './stringAvailabilityData.js';
import ImpactDetails from './ImpactDetails.jsx';
import { exportImpactExcel, exportImpactPdf, impactSummary, impactTypes } from './impactDetailsData.js';

function SiteDetail({ site, showImpact = false }) {
  const impacts = [
    ['Inverter Breakdown', effectiveImpact(site, 'bd_cnt', 'inv_bd_impact'), COLORS.warn],
    ['String', effectiveImpact(site, 'str_cnt', 'str_impact'), COLORS.bad],
    ['Comms / Potential', effectiveImpact(site, 'comms_cnt', 'pot_impact'), COLORS.cyan],
  ];
  const totalImpact = impacts.reduce((total, [, value]) => total + value, 0);
  const metrics = [
    ['Rank', formatNumber(site.rank)], ['DC Capacity', `${formatNumber(site.dc)} kW`], ['AC Capacity', `${formatNumber(site.ac)} kW`],
    ['Actual / Expected', formatPercent(site.ae)], ['DSD Availability', formatPercent(site.dsd)], ['Grade', site.grade || '—'],
    ['INV / PM', site.invpm ? Number(site.invpm).toFixed(2) : '—'], ['Inverters', formatNumber(site.tot_inv)],
    ['Active Breakdowns', formatNumber(site.bd_cnt)], ['Strings Down', formatNumber(site.str_cnt)], ['MPPT', formatNumber(site.mppt_cnt)], ['Active Comms', formatNumber(site.comms_cnt)],
  ];
  const issues = [
    ['Inverter Breakdown (active)', site.bd_txt, COLORS.warn], ['String Anomaly', site.str_txt, COLORS.bad],
    ['MPPT Voltage Anomaly', site.mppt_txt, COLORS.purple], ['Communication Issue (active)', site.comms_txt, COLORS.cyan],
  ];
  return (
    <>
      {showImpact && (
        <Box sx={{ mb: 1.5, p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1.5, bgcolor: 'action.hover' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={800}>SUM OF CATEGORY IMPACTS</Typography>
          <Typography sx={{ fontSize: 27, fontWeight: 900, color: totalImpact > 0 ? COLORS.bad : COLORS.good }}>{formatPercent(totalImpact)}</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1, mt: 1 }}>
            {impacts.map(([label, value, color]) => (
              <Box key={label} sx={{ p: 1, borderRadius: 1, border: `1px solid ${color}66` }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
                <Typography fontWeight={900} sx={{ color }}>{formatPercent(value)}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 1, mb: 1.5 }}>
        {metrics.map(([label, value]) => (
          <Box key={label} sx={{ p: 1, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
            <Typography fontWeight={900}>{value}</Typography>
          </Box>
        ))}
      </Box>
      <Stack spacing={1}>
        {issues.map(([label, value, color]) => {
          const text = cleanText(value);
          if (!text) return null;
          const lines = text.split(/\s*\|\s*|\r?\n/).map((line) => line.trim()).filter(Boolean);
          return (
            <Box key={label} sx={{ p: 1.25, border: 1, borderColor: 'divider', borderRadius: 1.5, bgcolor: 'action.hover' }}>
              <Typography variant="caption" fontWeight={900} sx={{ color }}>{label}</Typography>
              <Stack spacing={0.6} sx={{ mt: 0.7 }}>
                {lines.map((line, index) => <Typography key={index} variant="body2" sx={{ pl: 1.2, borderLeft: `3px solid ${color}`, overflowWrap: 'anywhere' }}>{line}</Typography>)}
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </>
  );
}


// Compact, chart-specific popup used by "Top 10 Impacted Sites" only.
function ImpactedSiteDetail({ site }) {
  const breakdown = effectiveImpact(site, 'bd_cnt', 'inv_bd_impact');
  const string = effectiveImpact(site, 'str_cnt', 'str_impact');
  const comms = effectiveImpact(site, 'comms_cnt', 'pot_impact');
  const total = breakdown + string + comms;
  const issueSections = [
    ['Inverter Breakdown', site.bd_txt, COLORS.warn],
    ['String Anomaly', site.str_txt, COLORS.bad],
    ['Communication Issue (active)', site.comms_txt, COLORS.cyan],
  ].map(([label, value, color]) => ({ label, color, lines: cleanText(value).split(/\s*\|\s*|\r?\n/).map((entry) => entry.trim()).filter(Boolean) }))
    .filter(({ lines }) => lines.length);
  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 1, mb: 1.3 }}>
        {[
          ['ACTUAL/EXP', formatPercent(site.ae), COLORS.accent],
          ['GRADE', site.grade ?? '—', 'text.primary'],
          ['TOTAL IMPACT', formatPercent(total), COLORS.warn],
        ].map(([label, value, color]) => <Box key={label} sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, p: 1.2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
          <Typography fontWeight={900} sx={{ fontSize: 22, color }}>{value}</Typography>
        </Box>)}
      </Box>
      <Box sx={{ p: 1.4, border: 1, borderColor: 'divider', borderRadius: 1.5, bgcolor: 'action.hover' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
          <Typography fontWeight={850}>{site.site}</Typography>
          <Typography fontWeight={900} sx={{ color: COLORS.accent }}>{formatPercent(site.ae)}</Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3 }}>
          Rank {formatNumber(site.rank)} · DC {formatNumber(site.dc)} kW · AC {formatNumber(site.ac)} kW · INV/PM {site.invpm_status || '—'} · Inverters {formatNumber(site.tot_inv)}
        </Typography>
        <Box sx={{ display: 'inline-block', mt: 0.7, px: 1, py: 0.4, borderRadius: 1, border: `1px solid ${COLORS.warn}80`, color: COLORS.warn, fontSize: 12, fontWeight: 800 }}>
          Breakdown {formatPercent(breakdown)} · String {formatPercent(string)} · Comms {formatPercent(comms)}
        </Box>
        {issueSections.map(({ label, color, lines }) => <Box key={label} sx={{ mt: 1 }}>
          <Typography variant="caption" sx={{ color, fontWeight: 800 }}>{label}</Typography>
          <Stack spacing={0.5} sx={{ mt: 0.4 }}>
            {lines.map((line, index) => <Typography key={index} variant="body2" sx={{ pl: 1.1, borderLeft: `3px solid ${color}`, overflowWrap: 'anywhere' }}>▸ {line}</Typography>)}
          </Stack>
        </Box>)}
      </Box>
    </>
  );
}

// ---- System Health popups (DSD / Adirain / Data / Inverter) -----------------
const HEALTH_META = {
  dsd: { color: COLORS.accent, label: 'DSD' },
  adirain: { color: COLORS.good, label: 'Adirain' },
  data: { color: COLORS.purple, label: 'Data' },
  inverter: { color: COLORS.cyan, label: 'Inverter' },
};

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));
const availabilityColor = (value) => (value >= 0.95 ? COLORS.good : value >= 0.9 ? COLORS.warn : COLORS.bad);
const EXPANDABLE_HEALTH_KINDS = new Set(['adirain', 'data', 'inverter']);

function parseInverterNumbers(text, totalInverters = 0) {
  const value = cleanText(text);
  if (!value) return [];
  const ids = new Set();
  const regex = /inv(?:erter)?\.?\s*(\d+)(?:\s*[-–]\s*(\d+))?/gi;
  let match = regex.exec(value);
  while (match) {
    const start = Number(match[1]) || 0;
    const rawEnd = Number(match[2]) || start;
    const end = totalInverters ? Math.min(rawEnd, totalInverters) : rawEnd;
    for (let current = start; current <= end; current += 1) ids.add(current);
    match = regex.exec(value);
  }
  return [...ids].filter((id) => id > 0).sort((a, b) => a - b);
}

function buildAvailabilityRows(totalInverters, siteAvailability, affectedInverters = []) {
  const total = Math.max(0, Math.round(Number(totalInverters) || 0));
  if (!total) return [];
  const availability = clamp01(siteAvailability);
  const impacted = [...new Set((affectedInverters || []).filter((id) => id >= 1 && id <= total))].sort((a, b) => a - b);
  if (!impacted.length) {
    return Array.from({ length: total }, (_, index) => ({ label: `INV ${index + 1}`, value: availability }));
  }
  const normalCount = total - impacted.length;
  const impactedValue = clamp01((availability * total - normalCount) / impacted.length);
  return Array.from({ length: total }, (_, index) => {
    const inverterNumber = index + 1;
    return { label: `INV ${inverterNumber}`, value: impacted.includes(inverterNumber) ? impactedValue : 1 };
  });
}

function inverterWiseHealthRows(site, kind) {
  if (kind === 'data') {
    return buildAvailabilityRows(site.tot_inv, healthValue(site, 'data'), parseInverterNumbers(site.comms_txt, site.tot_inv));
  }
  if (kind === 'inverter') {
    return buildAvailabilityRows(site.tot_inv, healthValue(site, 'inverter'), parseInverterNumbers(site.bd_txt, site.tot_inv));
  }
  return [];
}

function AvailabilityBreakdown({ rows, sourceText }) {
  const note = cleanText(sourceText);
  return (
    <Box sx={{ mt: 1.1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
      <Stack spacing={0.8}>
        {rows.map(({ label, value }) => {
          const color = availabilityColor(value);
          return (
            <Box key={label} sx={{ display: 'grid', gridTemplateColumns: 'minmax(96px, 140px) 1fr auto', gap: 1, alignItems: 'center' }}>
              <Typography variant="body2" fontWeight={700}>{label}</Typography>
              <Box sx={{ height: 8, borderRadius: 999, overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.08)' }}>
                <Box sx={{ width: `${clamp01(value) * 100}%`, height: '100%', bgcolor: color, borderRadius: 999 }} />
              </Box>
              <Typography variant="body2" fontWeight={900} sx={{ color, minWidth: 56, textAlign: 'right' }}>{formatPercent(value)}</Typography>
            </Box>
          );
        })}
      </Stack>
      {note && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.9 }}>{note}</Typography>}
    </Box>
  );
}

export function healthValue(site, kind) {
  const string = siteStringAvailability(site);
  if (kind === 'dsd') return Number(site.dsd) || 0;
  if (kind === 'data') return Number(site.data_avail) || 0;
  if (kind === 'inverter') return Number(site.inv_avail) || 0;
  if (kind === 'string') return string;
  return (Number(site.data_avail) || 0) * (Number(site.inv_avail) || 0) * string;
}

function healthMetrics(site, kind) {
  if (kind === 'adirain') {
    return [
      ['Adirain', healthValue(site, 'adirain'), COLORS.good],
      ['Data', healthValue(site, 'data'), COLORS.purple],
      ['Inverter', healthValue(site, 'inverter'), COLORS.cyan],
      ['String', healthValue(site, 'string'), COLORS.warn],
    ];
  }
  return [[HEALTH_META[kind]?.label || kind, healthValue(site, kind), HEALTH_META[kind]?.color || COLORS.accent]];
}

function HealthDetails({ sites, kind }) {
  const color = HEALTH_META[kind]?.color || COLORS.accent;
  const [expandedSite, setExpandedSite] = useState(null);
  const isExpandable = EXPANDABLE_HEALTH_KINDS.has(kind);
  return (
    <Stack spacing={0.8}>
      {sites.length ? sites.map((site, index) => {
        const availability = healthValue(site, kind);
        const isAdirain = kind === 'adirain';
        const isExpanded = expandedSite === index;
        const perInverterRows = isAdirain ? [] : inverterWiseHealthRows(site, kind);
        const sourceText = kind === 'data' ? site.comms_txt : kind === 'inverter' ? site.bd_txt : '';
        return (
          <Box key={`${site.site}-${index}`} sx={{ p: 1.1, border: 1, borderColor: 'divider', borderRadius: 1.5, bgcolor: 'action.hover' }}>
            <Box
              onClick={isExpandable ? () => setExpandedSite(isExpanded ? null : index) : undefined}
              onKeyDown={isExpandable ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setExpandedSite(isExpanded ? null : index); } } : undefined}
              role={isExpandable ? 'button' : undefined}
              tabIndex={isExpandable ? 0 : undefined}
              aria-expanded={isExpandable ? isExpanded : undefined}
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, cursor: isExpandable ? 'pointer' : 'default' }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={850} sx={{ fontSize: 14 }}>
                  {isExpandable ? (isExpanded ? '▾ ' : '▸ ') : ''}
                  {site.site}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3 }}>
                  {kind === 'dsd' ? `Rank ${formatNumber(site.rank)} · DC ${formatNumber(site.dc)} kW · Grade ${site.grade ?? '—'}` : `Inverters ${formatNumber(site.tot_inv)} · DC ${formatNumber(site.dc)} kW · Grade ${site.grade ?? '—'}`}
                </Typography>
              </Box>
              <Typography fontWeight={900} sx={{ color, whiteSpace: 'nowrap' }}>{formatPercent(availability)}</Typography>
            </Box>
            {isAdirain && isExpanded && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                {healthMetrics(site, kind).slice(1).map(([label, value, metricColor]) => (
                  <Chip key={label} size="small" variant="outlined" label={`${label}: ${formatPercent(value)}`} sx={{ color: metricColor, borderColor: metricColor }} />
                ))}
              </Box>
            )}
            {!isAdirain && isExpanded && perInverterRows.length > 0 && <AvailabilityBreakdown rows={perInverterRows} sourceText={sourceText} />}
          </Box>
        );
      }) : <Typography color="text.secondary" align="center" sx={{ py: 5 }}>No sites match this detail.</Typography>}
    </Stack>
  );
}

function exportHealthExcel(sites, kind, title) {
  const headers = kind === 'adirain'
    ? ['Site', 'Adirain %', 'Data %', 'Inverter %', 'String %', 'Inverters', 'Configured Strings', 'Strings Down', 'DC (kW)']
    : ['Site', `${HEALTH_META[kind]?.label || ''} %`, 'Inverters', 'Configured Strings', 'Strings Down', 'DC (kW)'];
  const rows = sites.map((site) => [
    site.site, ...healthMetrics(site, kind).map(([, value]) => formatPercent(value)),
    site.tot_inv || 0, site.total_strings || 0, site.str_cnt || 0, site.dc || 0,
  ]);
  exportWorkbook(title, headers, rows, title);
}


// ---------------------------------------------------------------------------
// Dispatch ROI popup — shows ONLY the ROI chart details for the selected site
// ---------------------------------------------------------------------------
function RoiDetail({ row }) {
  const color = row.band?.color || COLORS.accent;
  const payback = row.payback == null ? 'No Loss' : `${formatNumber(Math.round(row.payback))} days`;
  const items = [
    ['PPA', `$${Number(row.ppa).toFixed(2)} / kWh`],
    ['Dispatch (repair) cost', `$${formatNumber(row.dispatchCost)}`],
    ['String breakdown loss', `${formatNumber(row.strLoss, 2)} kWh`],
    ['Inverter breakdown loss', `${formatNumber(row.invLoss, 2)} kWh`],
    ['Total energy loss', `${formatNumber(row.energyLoss, 2)} kWh`],
    ['Financial loss (period)', `$${formatNumber(row.financialLoss, 2)}`],
    ['Daily financial loss', `$${formatNumber(row.dailyLoss, 2)} / day`],
    ['Analysis period', `${formatNumber(row.analysisDays)} days`],
  ];
  return (
    <>
      <Box sx={{ p: 1.5, mb: 1.25, borderRadius: 1.5, border: `1px solid ${color}77`, bgcolor: `${color}12`, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={800}>PAYBACK PERIOD</Typography>
          <Typography sx={{ fontSize: 30, fontWeight: 900, color, lineHeight: 1.1 }}>{payback}</Typography>
        </Box>
        {row.band && <Chip label={row.band.label} sx={{ ml: 'auto', fontWeight: 800, color, bgcolor: `${color}22`, border: `1px solid ${color}66` }} />}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 1 }}>
        {items.map(([label, value]) => (
          <Box key={label} sx={{ p: 1, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{label}</Typography>
            <Typography fontWeight={900}>{value}</Typography>
          </Box>
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.25 }}>
        Financial loss = (String + Inverter breakdown loss kWh) × PPA · Payback = Dispatch cost ÷ daily financial loss
      </Typography>
    </>
  );
}

// ---------------------------------------------------------------------------
export default function DetailsDialog({ detail, onClose, onFilter }) {
  const sites = detail?.sites || [];
  const isString = detail?.kind === 'stringAvailability';
  const isHealth = detail?.kind === 'health';
  const isRoi = detail?.kind === 'roi';
  const isImpactedSite = detail?.kind === 'impactedSite';
  const impactConfig = detail?.kind === 'impact' ? impactTypes[detail.impactKey] : null;
  return (
    <Dialog open={Boolean(detail)} onClose={onClose} fullWidth maxWidth={impactConfig || isHealth ? 'lg' : 'md'} scroll="paper" aria-labelledby="details-title">
      {detail && (
        <>
          <DialogTitle sx={{ pr: 6, py: impactConfig ? 2 : undefined }}>
            {impactConfig && <Box component="span" sx={{ display: 'inline-block', width: 10, height: 10, mr: 1.2, borderRadius: '50%', bgcolor: impactConfig.color, verticalAlign: 'middle' }} />}
            <Typography id="details-title" component="span" fontWeight={900} sx={{ fontSize: impactConfig ? 22 : undefined, color: detail.kind === 'grade' ? detail.color : 'text.primary' }}>
              {isString || isHealth ? `${detail.title} by Site (${sites.length})` : detail.title}
              {impactConfig && <Box component="span" sx={{ color: '#4f94ff' }}> ({formatNumber(impactSummary(sites, impactConfig).count)})</Box>}
            </Typography>
            {!impactConfig && <Typography display="block" variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>{detail.subtitle}</Typography>}
            <IconButton aria-label="Close details" onClick={onClose} sx={{ position: 'absolute', right: 10, top: 10 }}><CloseRoundedIcon /></IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {isRoi ? <RoiDetail row={detail.roi} />
              : impactConfig ? <ImpactDetails sites={sites} config={impactConfig} />
              : isImpactedSite ? <ImpactedSiteDetail site={sites[0]} />
              : isString ? <StringAvailabilityDetails sites={sites} />
                : isHealth ? <HealthDetails sites={sites} kind={detail.healthKind} />
                  : sites.length === 1 && (detail.kind === 'site' || detail.kind === 'impactedSite') ? <SiteDetail site={sites[0]} showImpact={detail.kind === 'impactedSite'} />
                    : (
                      <Stack spacing={1}>
                        {sites.length ? sites.map((site, index) => (
                          <Box key={`${site.site}-${index}`} sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, p: 1.25 }}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Chip size="small" label={`#${index + 1}`} sx={{ fontWeight: 900 }} />
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography fontWeight={800}>{site.site}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
                                  {detail.kind === 'allSites'
                                    ? <>Actual/Exp {formatPercent(site.ae)} · DSD Avail {formatPercent(site.dsd)} · AC {formatNumber(site.ac)} kW · Inverters {formatNumber(site.tot_inv)} · INV/PM {site.invpm_status || '—'}</>
                                    : detail.compactView
                                    ? <>Rank {formatNumber(site.rank)} · DC {formatNumber(site.dc)} kW · Grade {site.grade ?? '—'}</>
                                    : <>Actual/Exp {formatPercent(site.ae)} · DSD Avail {formatPercent(site.dsd)} · DC {formatNumber(site.dc)} kW · Inverters {formatNumber(site.tot_inv)} · INV/PM {site.invpm_status || '—'}</>}
                                </Typography>
                              </Box>
                              {detail.valueFor && <Typography fontWeight={900} color={detail.color || COLORS.accent}>{detail.valueFor(site)}</Typography>}
                            </Stack>
                            {detail.textKey && cleanText(site[detail.textKey]) && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8 }}>{cleanText(site[detail.textKey])}</Typography>}
                          </Box>
                        )) : <Typography color="text.secondary" align="center" sx={{ py: 5 }}>No sites match this detail.</Typography>}
                      </Stack>
                    )}
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 1.25, flexWrap: 'wrap', gap: 0.5 }}>
            {isString && <><Button size="small" color="success" variant="outlined" startIcon={<FileDownloadRoundedIcon />} onClick={() => exportStringExcel(sites)} disabled={!sites.length}>Excel</Button><Button size="small" color="error" variant="outlined" startIcon={<PictureAsPdfRoundedIcon />} onClick={() => exportStringPdf(sites)} disabled={!sites.length}>PDF</Button></>}
            {isHealth && <Button size="small" color="success" variant="outlined" startIcon={<FileDownloadRoundedIcon />} onClick={() => exportHealthExcel(sites, detail.healthKind, detail.title)} disabled={!sites.length}>Excel</Button>}
            {impactConfig && <><Button size="small" color="success" variant="outlined" startIcon={<FileDownloadRoundedIcon />} onClick={() => exportImpactExcel(sites, impactConfig)} disabled={!sites.length}>Excel</Button><Button size="small" color="error" variant="outlined" startIcon={<PictureAsPdfRoundedIcon />} onClick={() => exportImpactPdf(sites, impactConfig)} disabled={!sites.length}>PDF</Button></>}
            {sites.length > 1 && <Button startIcon={<FilterAltRoundedIcon />} onClick={() => onFilter(sites)}>Filter dashboard to these sites</Button>}
            <Button variant="contained" onClick={onClose}>Close</Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
