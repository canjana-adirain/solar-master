import { Card, Box, useTheme } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { COLORS } from '../../constants.js';
import { topImpactedSites } from '../../utils/analytics.js';
import SectionHeader from '../common/SectionHeader.jsx';
import PerformanceRanking from './PerformanceRanking.jsx';
import './chartSetup.js';

export default function PortfolioCharts({ sites, onSiteClick, onImpactedSiteClick = onSiteClick }) {
  const theme = useTheme();
  const impacted = topImpactedSites(sites);
  const axis = { ticks: { color: theme.palette.text.secondary, font: { size: 10 }, autoSkip: false }, grid: { color: theme.palette.divider } };
  const options = {
    indexAxis: 'y', responsive: true, maintainAspectRatio: false,
    color: theme.palette.text.secondary,
    plugins: { legend: { display: true, labels: { color: theme.palette.text.secondary } } },
    scales: { x: { ...axis, beginAtZero: true, stacked: true }, y: { ...axis, grid: { display: false }, stacked: true } },
    onClick: (_, elements) => elements[0] && onImpactedSiteClick(impacted[elements[0].index].site),
    onHover: (event, elements) => { if (event.native?.target) event.native.target.style.cursor = elements.length ? 'pointer' : 'default'; },
  };

  return <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1.5, mb: 1.5 }}>
    <Box id="site-performance-ranking" tabIndex={-1} sx={{ scrollMarginTop: { xs: '140px', lg: '90px' } }}>
      <PerformanceRanking sites={sites} onSiteClick={onSiteClick} />
    </Box>
    <Card id="top-impacted-sites" tabIndex={-1} sx={{ p: 1.75, scrollMarginTop: { xs: '140px', lg: '90px' } }}>
      <SectionHeader color="secondary.main" title="Top 10 Impacted Sites — Total Impact %" subtitle="Click a bar for the site’s detailed impact" />
      <Box sx={{ height: 360 }}>
        <Bar data={{ labels: impacted.map(({ site }) => site.site.slice(0, 36)), datasets: [
          { label: 'Breakdown %', data: impacted.map(({ bd }) => bd * 100), backgroundColor: COLORS.warn, borderRadius: 3 },
          { label: 'String %', data: impacted.map(({ string }) => string * 100), backgroundColor: COLORS.bad, borderRadius: 3 },
          { label: 'Comms / Potential %', data: impacted.map(({ comms }) => comms * 100), backgroundColor: COLORS.cyan, borderRadius: 3 },
        ] }} options={options} />
      </Box>
    </Card>
  </Box>;
}
