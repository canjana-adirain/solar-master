import { useRef } from 'react';
import { Box, Card, CardActionArea, Chip, Divider, Stack, Typography } from '@mui/material';
import { GRADE_COLOR } from '../../constants.js';
import { formatPercent } from '../../utils/format.js';
import { gradeCounts } from '../../utils/analytics.js';
import DownloadButtons from '../common/DownloadButtons.jsx';

const gradeMeta = {
  5: ['Excellent', '≥95%'],
  4: ['Good', '90–95%'],
  3: ['Fair', '80–90%'],
  2: ['Poor', '70–80%'],
  1: ['Critical', '<70%'],
};

export default function PerformanceMatrix({ sites, summary, previousSummary, onGradeClick, onExcel, onPdf }) {
  const ref = useRef(null);
  const counts = gradeCounts(sites);
  const pe = Number(summary.averageActualExpected || 0);
  const specificYield = Number(summary.specificYield || 0);

  const comparison = (current, previous, { percent = true } = {}) => {
    if (!previousSummary || !Number.isFinite(previous)) return { label: 'no previous round', tone: 'flat' };
    const difference = percent ? (current - previous) * 100 : current - previous;
    if (Math.abs(difference) < 0.05) return { label: '→ 0.0% vs Previous Round', tone: 'flat' };
    const up = difference > 0;
    return { label: `${up ? '↑ +' : '↓ '}${Math.abs(difference).toFixed(1)}${percent ? '%' : ''} vs Previous Round`, tone: up ? 'up' : 'down' };
  };
  const peComparison = comparison(pe, Number(previousSummary?.averageActualExpected));
  const yieldComparison = comparison(specificYield, Number(previousSummary?.specificYield), { percent: false });
  const comparisonChip = ({ label, tone }) => (
    <Box sx={{ mt: 0.6, px: 1, py: 0.3, borderRadius: 4, fontSize: 10.5, fontWeight: 800,
      color: tone === 'up' ? '#22c55e' : tone === 'down' ? '#ff7070' : 'text.secondary',
      bgcolor: tone === 'up' ? 'rgba(34,197,94,.12)' : tone === 'down' ? 'rgba(239,68,68,.12)' : 'action.hover' }}>
      {label}
    </Box>
  );

  const peColor = pe >= 0.95 ? '#22c55e' : pe >= 0.9 ? '#a3e635' : '#f59e0b';
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashArray = `${Math.max(0, Math.min(1, pe)) * circumference} ${circumference}`;

  const avgPE = (grade) => {
    const gradeSites = sites.filter((site) => site.grade === grade);
    if (!gradeSites.length) return null;
    return gradeSites.reduce((sum, site) => sum + (Number(site.ae) || 0), 0) / gradeSites.length;
  };

  return (
    <Card ref={ref} sx={{ p: { xs: 1.5, lg: 1.75 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1, mb: 1.5 }}>
        <Box sx={{ width: 32, height: 32, borderRadius: 1.5, background: 'linear-gradient(135deg,#0ea5e9,#2563eb)', display: 'grid', placeItems: 'center', fontSize: 17, flexShrink: 0 }}>📈</Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 800, lineHeight: 1.2 }}>PERFORMANCE MATRIX</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5, lineHeight: 1.2, display: 'block' }}>
            Production vs. weather-adjusted expectation, specific yield &amp; grades
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto', alignSelf: 'flex-start', flexShrink: 0 }}>
          <DownloadButtons compact onExcel={onExcel} onPdf={() => onPdf(ref.current)} />
        </Box>
      </Box>

      {/* Gauge + Specific Yield */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, alignItems: 'center', mb: 1.5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box sx={{ width: 128, height: 128, position: 'relative' }}>
            <svg width="128" height="128" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r={radius} fill="none" stroke="#1c2b45" strokeWidth="10" />
              <circle cx="64" cy="64" r={radius} fill="none" stroke={peColor} strokeWidth="10" strokeLinecap="round" strokeDasharray={dashArray} transform="rotate(-90 64 64)" />
            </svg>
            <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
              <Box>
                <Typography sx={{ fontSize: 26, fontWeight: 900, lineHeight: 1.1, color: peColor }}>{formatPercent(pe)}</Typography>
                <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Production / Expected</Typography>
              </Box>
            </Box>
          </Box>
          {comparisonChip(peComparison)}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(47,129,247,.5)', display: 'grid', placeItems: 'center', mb: 0.5, fontSize: 19 }}>☀️</Box>
          <Typography sx={{ color: '#3b82f6', fontWeight: 700, fontSize: 11 }}>kWh/kWp (period)</Typography>
          <Typography sx={{ fontSize: 30, fontWeight: 900, color: '#3b82f6', lineHeight: 1.1 }}>
            {specificYield > 0 ? specificYield.toFixed(2) : '—'}
          </Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Specific Yield</Typography>
          {comparisonChip(yieldComparison)}
        </Box>
      </Box>

      <Divider sx={{ mb: 1.1 }} />

      {/* Grade rows */}
      <Stack spacing={0.9} sx={{ flex: 1, justifyContent: 'space-between' }}>
        {[5, 4, 3, 2, 1].map((grade) => {
          const avg = avgPE(grade);
          return (
            <CardActionArea
              key={grade}
              onClick={() => onGradeClick(grade)}
              title="Click for details"
              sx={{ borderRadius: 1.5, border: `1px solid ${GRADE_COLOR[grade]}55`, px: 1.15, py: 0.75, flex: 1, display: 'flex', alignItems: 'center',
                '&:hover': { bgcolor: `${GRADE_COLOR[grade]}14`, borderColor: GRADE_COLOR[grade] } }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: GRADE_COLOR[grade], boxShadow: `0 0 0 3px ${GRADE_COLOR[grade]}22`, flexShrink: 0 }} />
                <Typography variant="body2" fontWeight={700} sx={{ fontSize: 12.5 }}>{gradeMeta[grade][0]}</Typography>
                <Typography sx={{ fontSize: 10, color: 'text.secondary', flex: 1 }}>{gradeMeta[grade][1]}</Typography>
                <Typography sx={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  <span style={{ color: '#A7B1C2', fontWeight: 600 }}>Avg P/E</span>{' '}
                  <span style={{ color: GRADE_COLOR[grade], fontWeight: 800 }}>{avg == null ? '—' : `${Math.round(avg * 100)}%`}</span>
                </Typography>
                <Chip size="small" label={`${counts[grade]} site${counts[grade] === 1 ? '' : 's'}`} sx={{ height: 20, fontSize: 11, color: GRADE_COLOR[grade], fontWeight: 800 }} />
              </Stack>
            </CardActionArea>
          );
        })}
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontSize: 10, lineHeight: 1.35 }}>
        👆 Click a grade for details · P/E % = Production ÷ Weather Adjusted Expectation
      </Typography>
    </Card>
  );
}
