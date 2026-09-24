import { useRef } from 'react';
import CableRoundedIcon from '@mui/icons-material/CableRounded';
import CellTowerRoundedIcon from '@mui/icons-material/CellTowerRounded';
import ElectricBoltRoundedIcon from '@mui/icons-material/ElectricBoltRounded';
import NetworkCheckRoundedIcon from '@mui/icons-material/NetworkCheckRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { Box, Card, CardActionArea, LinearProgress, Stack, Typography } from '@mui/material';
import { COLORS } from '../../constants.js';
import { formatNumber, formatPercent } from '../../utils/format.js';
import DownloadButtons from '../common/DownloadButtons.jsx';
import SectionHeader from '../common/SectionHeader.jsx';

const tiles = (summary) => [
  { label: 'Inverter Breakdown', value: formatPercent(summary.bdImpact), count: `${formatNumber(summary.bdCount)} count`, color: COLORS.warn, icon: WarningAmberRoundedIcon, key: 'bd' },
  { label: 'String Breakdown', value: formatPercent(summary.stringImpact), count: `${formatNumber(summary.stringCount)} count`, color: COLORS.pink, icon: CableRoundedIcon, key: 'string' },
  { label: 'Comms / Potential', value: formatPercent(summary.commsImpact), count: `${formatNumber(summary.commsCount)} count`, color: COLORS.cyan, icon: CellTowerRoundedIcon, key: 'comms' },
  { label: 'MPPT Spikes', value: formatNumber(summary.mpptSpikes), count: 'count', color: COLORS.purple, icon: NetworkCheckRoundedIcon, key: 'mpptSpikes' },
  { label: 'Potential RSD Failures', value: formatNumber(summary.mpptCount), count: 'count', color: COLORS.good, icon: ElectricBoltRoundedIcon, key: 'mppt' },
];

export default function ProductionImpact({ summary, onMetricClick, onExcel, onPdf }) {
  const ref = useRef(null);
  const totalContribution = summary.bdImpact + summary.stringImpact + summary.commsImpact;
  const contributions = [
    [summary.bdImpact, COLORS.warn], [summary.commsImpact, COLORS.cyan], [summary.stringImpact, COLORS.pink],
  ];
  return (
    <Card ref={ref} sx={{ p: 1.75, height: '100%' }}>
      <SectionHeader color="error.main" title="PRODUCTION IMPACT — Where Losses Come From" action={<DownloadButtons compact onExcel={onExcel} onPdf={() => onPdf(ref.current)} />} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '180px 1fr' }, gap: 2, alignItems: 'center', mb: 1.5 }}>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={800}>TOTAL IMPACT</Typography>
          <Typography sx={{ fontSize: 36, fontWeight: 900, color: 'error.light' }}>{formatPercent(summary.totalImpact)}</Typography>
          <LinearProgress color="error" variant="determinate" value={summary.totalImpact * 100} sx={{ height: 8, borderRadius: 5 }} />
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={800}>IMPACT CONTRIBUTION BREAKDOWN</Typography>
          <Stack direction="row" sx={{ height: 25, mt: 0.75, borderRadius: 1, overflow: 'hidden', bgcolor: 'action.hover' }}>
            {contributions.map(([value, color]) => <Box key={color} sx={{ width: `${totalContribution ? value / totalContribution * 100 : 0}%`, bgcolor: color, display: 'grid', placeItems: 'center', minWidth: value ? 3 : 0 }}><Typography variant="caption" fontWeight={800}>{value / totalContribution > 0.12 ? `${Math.round(value / totalContribution * 100)}%` : ''}</Typography></Box>)}
          </Stack>
          <Stack direction="row" spacing={2} flexWrap="wrap" mt={0.75}>{[['Inverter', COLORS.warn], ['Comms', COLORS.cyan], ['String', COLORS.pink]].map(([label, color]) => <Typography key={label} variant="caption" color="text.secondary"><Box component="span" sx={{ display: 'inline-block', width: 8, height: 8, mr: 0.5, borderRadius: 0.5, bgcolor: color }} />{label}</Typography>)}</Stack>
        </Box>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }, gap: 1 }}>
        {tiles(summary).map(({ label, value, count, color, icon: Icon, key }) => (
          <CardActionArea key={key} onClick={() => onMetricClick(key)} sx={{ border: 1, borderColor: `${color}55`, borderRadius: 1.5, p: 1.1, minHeight: 122, '&:hover': { bgcolor: `${color}12`, borderColor: color } }}>
            <Stack direction="row" alignItems="center" spacing={0.6} color={color}><Icon fontSize="small" /><Typography variant="caption" fontWeight={800}>{label}</Typography></Stack>
            <Typography sx={{ fontSize: 22, fontWeight: 900, color, my: 0.35 }}>{value}</Typography>
            <Typography variant="caption" color="text.secondary">{count}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.6 }}>👆 Click for details</Typography>
          </CardActionArea>
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.25 }}>ℹ️ Impact % = DC capacity of impacted inverters/strings ÷ total DC capacity of selected sites. Spares, MPPT spikes and potential RSD failures are count-only.</Typography>
    </Card>
  );
}
