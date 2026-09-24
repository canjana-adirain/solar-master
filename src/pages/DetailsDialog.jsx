import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Typography } from '@mui/material';
import { COLORS } from '../../constants.js';
import { cleanText, formatNumber, formatPercent } from '../../utils/format.js';
import StringAvailabilityDetails from './StringAvailabilityDetails.jsx';
import { exportStringExcel, exportStringPdf } from './stringAvailabilityData.js';
import ImpactDetails from './ImpactDetails.jsx';
import { exportImpactExcel, exportImpactPdf, impactSummary, impactTypes } from './impactDetailsData.js';

function SiteDetail({ site }) {
  const metrics = [
    ['Rank', formatNumber(site.rank)], ['DC Capacity', `${formatNumber(site.dc)} kW`], ['AC Capacity', `${formatNumber(site.ac)} kW`],
    ['Actual / Expected', formatPercent(site.ae)], ['DSD Availability', formatPercent(site.dsd)], ['Grade', site.grade || '—'],
    ['INV / PM', site.invpm ? Number(site.invpm).toFixed(2) : '—'], ['Inverters', formatNumber(site.tot_inv)],
    ['Breakdowns', formatNumber(site.bd_cnt)], ['Strings', formatNumber(site.str_cnt)], ['MPPT', formatNumber(site.mppt_cnt)], ['Comms', formatNumber(site.comms_cnt)],
  ];
  const issues = [['Inverter Breakdown', site.bd_txt], ['String Anomaly', site.str_txt], ['MPPT Voltage Anomaly', site.mppt_txt], ['Communication Issue', site.comms_txt]];
  return <>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 1, mb: 1.5 }}>
      {metrics.map(([label, value]) => <Box key={label} sx={{ p: 1, border: 1, borderColor: 'divider', borderRadius: 1.5 }}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography fontWeight={900}>{value}</Typography></Box>)}
    </Box>
    <Stack spacing={1}>{issues.map(([label, value]) => cleanText(value) && <Box key={label} sx={{ p: 1.25, borderRadius: 1.5, bgcolor: 'action.hover' }}><Typography variant="caption" color="text.secondary" fontWeight={800}>{label}</Typography><Typography variant="body2" sx={{ mt: 0.25 }}>{cleanText(value)}</Typography></Box>)}</Stack>
  </>;
}

export default function DetailsDialog({ detail, onClose, onFilter }) {
  const sites = detail?.sites || [];
  const isString = detail?.kind === 'stringAvailability';
  const impactConfig = detail?.kind === 'impact' ? impactTypes[detail.impactKey] : null;
  return (
    <Dialog open={Boolean(detail)} onClose={onClose} fullWidth maxWidth={impactConfig ? 'lg' : 'md'} scroll="paper" aria-labelledby="details-title">
      {detail && <>
        <DialogTitle sx={{ pr: 6, py: impactConfig ? 2.2 : undefined }}>
          {impactConfig && <Box component="span" sx={{ display: 'inline-block', width: 10, height: 10, mr: 1.2, borderRadius: '50%', bgcolor: impactConfig.color, verticalAlign: 'middle' }} />}
          <Typography id="details-title" component="span" fontWeight={900} sx={{ fontSize: impactConfig ? 23 : undefined, color: detail.kind === 'grade' ? detail.color : 'text.primary' }}>{isString ? `${detail.title} by Site (${sites.length})` : detail.title}{impactConfig && <Box component="span" sx={{ color: '#4f94ff' }}> ({formatNumber(impactSummary(sites, impactConfig).count)})</Box>}</Typography>
          {!impactConfig && <Typography display="block" variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>{detail.subtitle}</Typography>}
          <IconButton aria-label="Close details" onClick={onClose} sx={{ position: 'absolute', right: 10, top: 10 }}><CloseRoundedIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {impactConfig ? <ImpactDetails sites={sites} config={impactConfig} /> : isString ? <StringAvailabilityDetails sites={sites} /> : sites.length === 1 && detail.kind === 'site' ? <SiteDetail site={sites[0]} /> : (
            <Stack spacing={1}>
              {sites.length ? sites.map((site, index) => (
                <Box key={`${site.site}-${index}`} sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, p: 1.25 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Chip size="small" label={`#${index + 1}`} sx={{ fontWeight: 900 }} />
                    <Typography fontWeight={800} flex={1}>{site.site}</Typography>
            {detail.compactView ? (
  <Typography
    variant="caption"
    color="text.secondary"
    sx={{
      display: 'block',
      mt: 0.4,
      ml: 5,
    }}
  >
    Rank {formatNumber(site.rank)}
    {' · '}
    DC {formatNumber(site.dc)} kW
    {' · '}
    Grade {site.grade ?? '—'}
  </Typography>
) : (
  <Typography
    variant="caption"
    color="text.secondary"
    sx={{
      display: 'block',
      mt: 0.4,
      ml: 5,
    }}
  >
    Actual/Exp {formatPercent(site.ae)}
    {' · '}
    DSD Avail {formatPercent(site.dsd)}
    {' · '}
    DC {formatNumber(site.dc)} kW
    {' · '}
    Inverters {formatNumber(site.tot_inv)}
    {' · '}
    INV/PM {site.invpm_status || '—'}
  </Typography>
)}
                    {detail.valueFor && <Typography fontWeight={900} color={detail.color || COLORS.accent}>{detail.valueFor(site)}</Typography>}
               
                  </Stack>
                  {detail.textKey && cleanText(site[detail.textKey]) && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8 }}>{cleanText(site[detail.textKey])}</Typography>}
                </Box>
              )) : <Typography color="text.secondary" align="center" sx={{ py: 5 }}>No sites match this detail.</Typography>}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
          {isString && <><Button size="small" startIcon={<FileDownloadRoundedIcon />} onClick={() => exportStringExcel(sites)} disabled={!sites.length}>Excel</Button><Button size="small" startIcon={<PictureAsPdfRoundedIcon />} onClick={() => exportStringPdf(sites)} disabled={!sites.length}>PDF</Button></>}
          {impactConfig && <><Button size="small" color="success" variant="outlined" startIcon={<FileDownloadRoundedIcon />} onClick={() => exportImpactExcel(sites, impactConfig)} disabled={!sites.length}>Excel</Button><Button size="small" color="error" variant="outlined" startIcon={<PictureAsPdfRoundedIcon />} onClick={() => exportImpactPdf(sites, impactConfig)} disabled={!sites.length}>PDF</Button></>}
          {sites.length > 1 && <Button startIcon={<FilterAltRoundedIcon />} onClick={() => onFilter(sites)}>Filter dashboard to these sites</Button>}
          <Button variant="contained" onClick={onClose}>Close</Button>
        </DialogActions>
      </>}
    </Dialog>
  );
}
