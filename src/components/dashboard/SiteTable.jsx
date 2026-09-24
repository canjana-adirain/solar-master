import { useMemo, useRef, useState } from 'react';
import { Box, Card, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Typography } from '@mui/material';
import { GRADE_COLOR, SITE_COLUMNS } from '../../constants.js';
import { cleanText, formatNumber, formatPercent } from '../../utils/format.js';
import DownloadButtons from '../common/DownloadButtons.jsx';
import SectionHeader from '../common/SectionHeader.jsx';

function CellValue({ site, keyName, type }) {
  const value = site[keyName];
  if (type === 'percent') return formatPercent(value);
  if (type === 'number') return formatNumber(value);
  if (type === 'grade') return value ? <Chip size="small" label={value} sx={{ height: 20, bgcolor: `${GRADE_COLOR[value]}25`, color: GRADE_COLOR[value], fontWeight: 900 }} /> : '—';
  if (type === 'status') return <Typography component="span" variant="caption" fontWeight={800} color={value === 'Good' ? 'success.light' : 'error.light'}>{value || '—'}</Typography>;
  if (type === 'text') return cleanText(value) || '—';
  return value || '—';
}

export default function SiteTable({ sites, totalCount, onExcel, onPdf, onSiteClick }) {
  const [sort, setSort] = useState({ key: 'rank', direction: 'asc' });
  const ref = useRef(null);
  const sorted = useMemo(() => [...sites].sort((left, right) => {
    const a = left[sort.key]; const b = right[sort.key];
    const numeric = Number.isFinite(Number(a)) && Number.isFinite(Number(b));
    const result = numeric ? Number(a) - Number(b) : String(a ?? '').localeCompare(String(b ?? ''));
    return sort.direction === 'asc' ? result : -result;
  }), [sites, sort]);
  const changeSort = (key) => setSort((current) => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }));

  return (
    <Card sx={{ p: 1.75, mb: 1.5 }}>
      <SectionHeader title="Site-Level Detail" subtitle={`· ${sites.length} of ${totalCount} sites`} action={<DownloadButtons onExcel={onExcel} onPdf={() => onPdf(ref.current)} />} />
      <TableContainer ref={ref} sx={{ maxHeight: 520, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
        <Table stickyHeader size="small">
          <TableHead><TableRow>{SITE_COLUMNS.map(([key, label, type]) => <TableCell key={key} align={type === 'number' || type === 'percent' || type === 'grade' ? 'right' : 'left'} sortDirection={sort.key === key ? sort.direction : false}><TableSortLabel active={sort.key === key} direction={sort.key === key ? sort.direction : 'asc'} onClick={() => changeSort(key)}>{label}</TableSortLabel></TableCell>)}</TableRow></TableHead>
          <TableBody>{sorted.map((site) => <TableRow hover key={site.site} onClick={() => onSiteClick(site)} sx={{ cursor: 'pointer' }}>{SITE_COLUMNS.map(([key, , type]) => <TableCell key={key} align={type === 'number' || type === 'percent' || type === 'grade' ? 'right' : 'left'} sx={type === 'text' ? { whiteSpace: 'normal', minWidth: 220, maxWidth: 340, color: 'text.secondary', fontSize: 11 } : undefined}><CellValue site={site} keyName={key} type={type} /></TableCell>)}</TableRow>)}</TableBody>
        </Table>
      </TableContainer>
      {!sites.length && <Box sx={{ py: 5, textAlign: 'center' }}><Typography color="text.secondary">No sites match the current filters.</Typography></Box>}
    </Card>
  );
}
