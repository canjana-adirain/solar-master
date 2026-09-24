import { useMemo } from 'react';
import { Box, Card, CardActionArea, LinearProgress, Stack, Typography, useTheme } from '@mui/material';
import { Doughnut } from 'react-chartjs-2';
import { COLORS } from '../../constants.js';
import { isHealthyInvPm } from '../../utils/analytics.js';
import SectionHeader from '../common/SectionHeader.jsx';
import './chartSetup.js';

const average = (sites) => {
  const values = sites.map((site) => Number(site.invpm)).filter((value) => Number.isFinite(value) && value > 0);
  return values.length ? (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2) : '—';
};

export default function InvPmHealth({ sites, summary, onStatusClick }) {
  const theme = useTheme();
  const goodSites = sites.filter(isHealthyInvPm);
  const badSites = sites.filter((site) => !isHealthyInvPm(site));
  const centerPlugin = useMemo(() => ({
    id: 'invPmCenter',
    afterDraw(chart) {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      const x = (chartArea.left + chartArea.right) / 2;
      const y = (chartArea.top + chartArea.bottom) / 2;
      ctx.save();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = summary.averageInvPm >= 0.95 && summary.averageInvPm <= 1.05 ? COLORS.good : COLORS.warn;
      ctx.font = '800 36px Segoe UI'; ctx.fillText(summary.averageInvPm > 0 ? summary.averageInvPm.toFixed(2) : '—', x, y - 12);
      ctx.fillStyle = theme.palette.text.primary; ctx.font = '700 13px Segoe UI'; ctx.fillText('Inv / PM', x, y + 12);
      ctx.fillStyle = theme.palette.text.secondary; ctx.font = '600 11px Segoe UI'; ctx.fillText(`${summary.healthyPercent}% Sites Healthy`, x, y + 28);
      ctx.restore();
    },
  }), [summary, theme]);

  const data = {
    labels: ['Good', 'Bad'],
    datasets: [{ data: [summary.goodInvPm, summary.badInvPm], backgroundColor: [COLORS.good, COLORS.bad], borderWidth: 0 }],
  };
  const options = {
    responsive: true, maintainAspectRatio: false, cutout: '67%',
    color: theme.palette.text.secondary,
    plugins: { legend: { position: 'bottom', labels: { color: theme.palette.text.secondary } } },
    onClick: (_, elements) => elements[0] && onStatusClick(elements[0].index === 0 ? 'Good' : 'Bad'),
    onHover: (event, elements) => { if (event.native?.target) event.native.target.style.cursor = elements.length ? 'pointer' : 'default'; },
  };

  return (
    <Card sx={{ p: 1.75, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <SectionHeader icon="🖥️" title="INV/PM HEALTH" subtitle="Ratio of ∑ Inverter to Production Meter reading" />
      <Box sx={{ height: 235 }}><Doughnut data={data} options={options} plugins={[centerPlugin]} /></Box>
      <Stack spacing={1.1} sx={{ mt: 1.5, flex: 1 }}>
        {[
          { label: 'Good', sites: goodSites, color: COLORS.good, icon: '✓' },
          { label: 'Bad', sites: badSites, color: COLORS.bad, icon: '⚠' },
        ].map(({ label, sites: group, color, icon }) => {
          const percent = sites.length ? Math.round(group.length / sites.length * 100) : 0;
          return (
            <CardActionArea key={label} onClick={() => onStatusClick(label)} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', flex: 1, p: 1.35, border: `1px solid ${color}55`, borderRadius: 1.5, bgcolor: `${color}0a` }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ width: 30, height: 30, borderRadius: '50%', bgcolor: `${color}22`, color, display: 'grid', placeItems: 'center', fontWeight: 900 }}>{icon}</Box>
                <Typography sx={{ color, fontSize: 20, fontWeight: 900 }}>{group.length}</Typography>
                <Typography sx={{ color, fontWeight: 800, flex: 1 }}>{label}</Typography>
                <Box sx={{ borderRadius: 2, px: 0.8, bgcolor: color, color: '#fff', fontSize: 11, fontWeight: 800 }}>{percent}%</Box>
              </Stack>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.4, fontWeight: 700 }}>Avg INV/PM {average(group)}</Typography>
              <LinearProgress variant="determinate" value={percent} sx={{ height: 5, mt: 0.6, borderRadius: 4, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: color } }} />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.6 }}>👆 Click for details</Typography>
            </CardActionArea>
          );
        })}
        <Box sx={{ p: 1.2, border: 1, borderColor: 'divider', borderRadius: 1.5, bgcolor: 'action.hover' }}>
          <Typography variant="body2" fontWeight={800}>📈 {average(sites)} <Typography component="span" variant="caption" color="text.secondary">Avg INV/PM (healthy 0.95–1.05)</Typography></Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.6 }}>
            <Box component="span" sx={{ color: COLORS.good }}>●</Box> Good = INV/PM within 0.95–1.05&nbsp;&nbsp; <Box component="span" sx={{ color: COLORS.bad }}>●</Box> Bad = INV/PM outside 0.95–1.05
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}
