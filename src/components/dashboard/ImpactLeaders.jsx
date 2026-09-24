import { useRef } from 'react';
import { Box, Card, List, ListItemButton, Stack, Typography } from '@mui/material';
import { COLORS } from '../../constants.js';
import { topByCount, topByImpact } from '../../utils/analytics.js';
import { formatNumber, formatPercent } from '../../utils/format.js';
import DownloadButtons from '../common/DownloadButtons.jsx';
import SectionHeader from '../common/SectionHeader.jsx';

const categories = (sites) => [
  { label: 'RSD (MPPT Volt)', color: COLORS.purple, rows: topByCount(sites, 'mppt_cnt').map((site) => ({ site, value: formatNumber(site.mppt_cnt) })) },
  { label: 'String Failure %', color: COLORS.bad, rows: topByImpact(sites, 'str_cnt', 'str_impact').map(({ site, value }) => ({ site, value: formatPercent(value) })) },
  { label: 'Inverter Breakdown %', color: COLORS.warn, rows: topByImpact(sites, 'bd_cnt', 'inv_bd_impact').map(({ site, value }) => ({ site, value: formatPercent(value) })) },
  { label: 'Potential Comms %', color: COLORS.cyan, rows: topByImpact(sites, 'comms_cnt', 'pot_impact').map(({ site, value }) => ({ site, value: formatPercent(value) })) },
];

export default function ImpactLeaders({ sites, onSiteClick, onExcel, onPdf }) {
  const ref = useRef(null);
  return (
    <Card ref={ref} sx={{ p: 1.75, height: '100%' }}>
      <SectionHeader icon="🏆" color="warning.main" title="TOP 5 IMPACTED SITES BY CATEGORY" subtitle="Ranked by capacity-weighted impact %" action={<DownloadButtons compact onExcel={onExcel} onPdf={() => onPdf(ref.current)} />} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
        {categories(sites).map(({ label, color, rows }) => (
          <Box key={label} sx={{ border: 1, borderColor: `${color}55`, borderRadius: 1.5, overflow: 'hidden' }}>
            <Typography sx={{ px: 1.25, py: 0.8, bgcolor: color, color: '#fff', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</Typography>
            <List dense disablePadding sx={{ p: 0.5 }}>
              {rows.length ? rows.map(({ site, value }, index) => (
                <ListItemButton key={site.site} onClick={() => onSiteClick(site)} sx={{ borderRadius: 1, px: 0.75, py: 0.45 }}>
                  <Stack direction="row" alignItems="center" spacing={0.75} width="100%" minWidth={0}>
                    <Box sx={{ width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: `${color}22`, color, fontSize: 10, fontWeight: 900 }}>#{index + 1}</Box>
                    <Typography variant="caption" noWrap flex={1}>{site.site}</Typography>
                    <Typography variant="caption" fontWeight={900} color={color}>{value}</Typography>
                  </Stack>
                </ListItemButton>
              )) : <Typography variant="caption" color="text.secondary" display="block" sx={{ p: 1 }}>No impacted sites in selection</Typography>}
            </List>
          </Box>
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.25, pt: 1.25, borderTop: 1, borderColor: 'divider' }}>
        ℹ️ Impact % = Impacted DC Capacity ÷ Total DC Capacity (of selected sites) · 👆 Click any item to view the site’s details.
      </Typography>
    </Card>
  );
}
