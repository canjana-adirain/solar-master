import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import CableRoundedIcon from '@mui/icons-material/CableRounded';
import DeveloperBoardRoundedIcon from '@mui/icons-material/DeveloperBoardRounded';
import PowerRoundedIcon from '@mui/icons-material/PowerRounded';
import { Box, Card, CardActionArea, Stack, Typography } from '@mui/material';
import { COLORS } from '../../constants.js';
import { formatNumber } from '../../utils/format.js';

const metrics = (summary) => [
  { label: 'Sites', value: summary.siteCount, icon: ApartmentRoundedIcon, color: COLORS.accent, action: 'sites' },
  { label: 'DC Capacity', value: summary.dc, unit: 'kW', icon: BoltRoundedIcon, color: COLORS.warn, action: 'dc' },
  { label: 'AC Capacity', value: summary.ac, unit: 'kW', icon: PowerRoundedIcon, color: COLORS.orange, action: 'ac' },
  { label: 'Inverter Count', value: summary.inverters, icon: DeveloperBoardRoundedIcon, color: COLORS.cyan, action: 'inverters' },
  { label: 'String Count', value: summary.strings, icon: CableRoundedIcon, color: COLORS.pink, action: 'strings' },
];

export default function StatStrip({ summary, onOpen }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(5, minmax(0, 1fr))' }, gap: 1.5, mb: 1.5 }}>
      {metrics(summary).map(({ label, value, unit, icon: Icon, color, action }) => (
        <Card key={label} sx={{ overflow: 'hidden', position: 'relative', '&::after': { content: '""', position: 'absolute', inset: 'auto 0 0', height: 3, bgcolor: color } }}>
          <CardActionArea onClick={() => onOpen(action)} sx={{ p: { xs: 1.5, sm: 2 }, height: '100%' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 46, height: 46, borderRadius: '50%', display: 'grid', placeItems: 'center', color, bgcolor: `${color}20`, border: `1px solid ${color}55`, flex: '0 0 auto' }}><Icon /></Box>
              <Box minWidth={0}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>{label}</Typography>
                <Typography sx={{ fontSize: { xs: 20, sm: 24 }, fontWeight: 800, lineHeight: 1.15, mt: 0.25 }}>{formatNumber(value)} {unit && <Typography component="span" variant="caption" color="text.secondary">{unit}</Typography>}</Typography>
              </Box>
            </Stack>
          </CardActionArea>
        </Card>
      ))}
    </Box>
  );
}
