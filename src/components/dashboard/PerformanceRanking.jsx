import { Box, Card, Stack, Tooltip, Typography } from '@mui/material';
import { COLORS } from '../../constants.js';
import { topAndBottomPerformance } from '../../utils/analytics.js';

const TARGET = 95;
const deviation = (site) => (Number(site?.ae) || 0) * 100 - TARGET;
const signed = (value) => `${value > 0 ? '+' : ''}${Math.round(value)}%`;

export default function PerformanceRanking({ sites, onSiteClick }) {
  const { top, bottom } = topAndBottomPerformance(sites);
  const bottomRows = [...bottom].reverse();
  const maxDeviation = Math.max(40, ...[...top, ...bottom].map((site) => Math.abs(deviation(site))));
  const scale = Math.ceil(maxDeviation / 20) * 20;
  const ticks = [-scale, -scale * 2 / 3, -scale / 3, 0, scale / 3, scale * 2 / 3, scale];
  const rowCount = Math.max(bottomRows.length, top.length);
  const halfBar = (site) => {
    if (!site) return null;
    const value = deviation(site);
    const size = Math.min(50, Math.abs(value) / scale * 50);
    return <Tooltip arrow placement="top" enterDelay={100} title={
      <Box sx={{ p: 0.3 }}>
        <Typography variant="body2" fontWeight={800}>{site.site}</Typography>
        <Typography variant="body2" sx={{ color: '#fb8383' }}>Actual P/E: {((Number(site.ae) || 0) * 100).toFixed(1)}%</Typography>
        <Typography variant="body2" sx={{ color: '#fb8383' }}>Deviation: {value.toFixed(1)}% vs Target {TARGET}%</Typography>
      </Box>
    }>
      <Box role="img" aria-label={`${site.site}: Actual P/E ${((Number(site.ae) || 0) * 100).toFixed(1)}%, deviation ${value.toFixed(1)}% from ${TARGET}% target`} sx={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', height: 12, left: value < 0 ? `${50 - size}%` : '50%', width: `${size}%`, bgcolor: value < 0 ? COLORS.bad : COLORS.good, borderRadius: '2px', minWidth: value ? 3 : 0, cursor: 'help', zIndex: 1 }} />
    </Tooltip>;
  };
  return <Card sx={{ p: { xs: 1.5, md: 2.5 }, height: '100%' }}>
    <Typography sx={{ fontSize: 17, fontWeight: 900, mb: 2 }}>📊 SITE PERFORMANCE RANKING — DIVERGING VIEW</Typography>
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
      <Box sx={{ bgcolor: '#b91c1c', border: `1px solid ${COLORS.bad}`, borderRadius: 4, px: 1.5, py: 0.7, fontWeight: 900 }}>↓ BOTTOM 10 SITES</Box>
      <Box sx={{ textAlign: 'center' }}><Typography variant="caption" color="text.secondary" fontWeight={800}>TARGET</Typography><Typography fontSize={20} fontWeight={900}>95%</Typography></Box>
      <Box sx={{ bgcolor: '#15803d', border: `1px solid ${COLORS.good}`, borderRadius: 4, px: 1.5, py: 0.7, fontWeight: 900 }}>↑ TOP 10 SITES</Box>
    </Stack>
    <Box sx={{ overflowX: 'auto' }}>
      <Box sx={{ minWidth: 740 }}>
        {Array.from({ length: rowCount }, (_, index) => {
          const low = bottomRows[index];
          const high = top[index];
          return <Box key={index} sx={{ display: 'grid', gridTemplateColumns: '30% 40% 30%', alignItems: 'center', minHeight: 30 }}>
            <Box onClick={() => low && onSiteClick(low)} role={low ? 'button' : undefined} tabIndex={low ? 0 : undefined} onKeyDown={(event) => low && (event.key === 'Enter' || event.key === ' ') && onSiteClick(low)} sx={{ display: 'flex', gap: 1, alignItems: 'center', cursor: low ? 'pointer' : 'default', '&:hover': { color: COLORS.bad }, minWidth: 0 }}>
              <Typography sx={{ color: deviation(low) < 0 ? '#fb8383' : COLORS.good, width: 52, flexShrink: 0, fontWeight: 900 }}>{low ? signed(deviation(low)) : ''}</Typography>
              <Typography variant="body2" fontWeight={700} noWrap title={low?.site}>{low?.site}</Typography>
            </Box>
            <Box sx={{ position: 'relative', height: 26, backgroundImage: 'linear-gradient(to right, transparent calc(50% - 1px), #dce7f3 calc(50% - 1px), #dce7f3 calc(50% + 1px), transparent calc(50% + 1px))', borderBottom: '1px solid rgba(130,150,180,.1)' }}>
              {halfBar(low)}{halfBar(high)}
            </Box>
            <Box onClick={() => high && onSiteClick(high)} role={high ? 'button' : undefined} tabIndex={high ? 0 : undefined} onKeyDown={(event) => high && (event.key === 'Enter' || event.key === ' ') && onSiteClick(high)} sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end', cursor: high ? 'pointer' : 'default', '&:hover': { color: COLORS.good }, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700} noWrap title={high?.site}>{high?.site}</Typography>
              <Typography sx={{ color: deviation(high) < 0 ? '#fb8383' : '#62e2a0', width: 52, flexShrink: 0, textAlign: 'right', fontWeight: 900 }}>{high ? signed(deviation(high)) : ''}</Typography>
            </Box>
          </Box>;
        })}
        <Box sx={{ display: 'grid', gridTemplateColumns: '30% 40% 30%', mt: 0.5 }}>
          <Box />
          <Stack direction="row" justifyContent="space-between">{ticks.map((tick, index) => <Typography key={index} variant="caption" sx={{ color: tick < 0 ? '#fb8383' : tick > 0 ? '#62e2a0' : 'text.primary', fontWeight: 800 }}>{signed(tick)}</Typography>)}</Stack>
        </Box>
      </Box>
    </Box>
    <Typography variant="caption" color="text.secondary" display="block" textAlign="center" sx={{ mt: 1, fontWeight: 800 }}>DEVIATION FROM TARGET (%)</Typography>
    <Stack direction="row" justifyContent="center" flexWrap="wrap" gap={2} sx={{ mt: 2 }}>
      <Typography variant="caption" color="text.secondary"><Box component="span" sx={{ color: COLORS.bad }}>━</Box> Below target</Typography>
      <Typography variant="caption" color="text.secondary">Target = 95% P/E</Typography>
      <Typography variant="caption" color="text.secondary"><Box component="span" sx={{ color: COLORS.good }}>━</Box> Above target</Typography>
    </Stack>
    <Typography variant="caption" color="text.secondary" display="block" sx={{ borderTop: 1, borderColor: 'divider', pt: 1.5, mt: 1.5 }}>ℹ️ P/E % = Production ÷ Weather Adjusted Expectation · Deviation % = P/E % − 95%. Click a site for details.</Typography>
  </Card>;
}
