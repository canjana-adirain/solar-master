import CableRoundedIcon from '@mui/icons-material/CableRounded';
import DataUsageRoundedIcon from '@mui/icons-material/DataUsageRounded';
import DeveloperBoardRoundedIcon from '@mui/icons-material/DeveloperBoardRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import { Box, Card, CardActionArea, LinearProgress, Stack, Typography } from '@mui/material';
import { COLORS } from '../../constants.js';
import { formatPercent } from '../../utils/format.js';
import SectionHeader from '../common/SectionHeader.jsx';

const clamp = (value) => Math.max(0, Math.min(100, (Number(value) || 0) * 100));
const comparison = (current, previous) => {
  if (!Number.isFinite(Number(previous)) || previous == null) return 'no previous round';
  const delta = (Number(current || 0) - Number(previous || 0)) * 100;
  if (Math.abs(delta) < 0.05) return '→ 0.0% vs previous round';
  return `${delta > 0 ? '↑ +' : '↓ '}${Math.abs(delta).toFixed(1)}% vs previous round`;
};

function Progress({ value, color, showScale = true }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <LinearProgress variant="determinate" value={clamp(value)} sx={{ height: 5, borderRadius: 5, bgcolor: 'rgba(148,163,184,.2)', '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 5 } }} />
      {showScale && (
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.2 }}>
          <Typography sx={{ fontSize: 8.5, color: 'text.secondary' }}>0%</Typography>
          <Typography sx={{ fontSize: 8.5, color: 'text.secondary' }}>100%</Typography>
        </Stack>
      )}
    </Box>
  );
}

function Gauge({ value }) {
  const size = 108;
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dash = `${clamp(value) / 100 * circumference} ${circumference}`;
  return (
    <Box sx={{ width: size, height: size, position: 'relative', flex: '0 0 auto', filter: 'drop-shadow(0 0 8px rgba(34,197,94,.3))' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(34,197,94,.14)" strokeWidth="9" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#22c55e" strokeWidth="9" strokeLinecap="round" strokeDasharray={dash} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <Box>
          <Typography sx={{ fontSize: 8, fontWeight: 900, lineHeight: 1.1 }}>⭐ ADIRAIN</Typography>
          <Typography sx={{ fontSize: 22, lineHeight: 1.1, fontWeight: 950, color: COLORS.good }}>{formatPercent(value)}</Typography>
          <Typography sx={{ fontSize: 7.5, color: 'text.secondary' }}>Data × Inv × String</Typography>
        </Box>
      </Box>
    </Box>
  );
}

function ChildCard({ title, value, previous, color, icon: Icon, description, onClick }) {
  return (
    <CardActionArea
      onClick={onClick}
      title="Click for site-wise details"
      sx={{ border: `1px solid ${color}88`, borderRadius: 1.5, px: 1, py: 0.8, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', bgcolor: `${color}09`, '&:hover': { bgcolor: `${color}14`, borderColor: color } }}
    >
      <Stack direction="row" alignItems="center" spacing={0.6}>
        <Box sx={{ width: 24, height: 24, display: 'grid', placeItems: 'center', borderRadius: 1, color, bgcolor: `${color}20`, border: `1px solid ${color}66`, '& svg': { fontSize: 15 } }}><Icon /></Box>
        <Typography fontWeight={900} noWrap sx={{ color, fontSize: 12.5 }}>{title}</Typography>
      </Stack>
      <Typography sx={{ mt: 0.5, fontSize: 22, lineHeight: 1.15, fontWeight: 950, color, textAlign: 'center' }}>{formatPercent(value)}</Typography>
      <Typography sx={{ fontSize: 9.5, color: 'text.secondary', textAlign: 'center', mb: 0.6 }}>{comparison(value, previous)}</Typography>
      <Progress value={value} color={color} />
      <Typography sx={{ mt: 0.5, fontSize: 10, color: 'text.secondary', lineHeight: 1.3 }}>{description}</Typography>
    </CardActionArea>
  );
}

export default function HealthCard({ summary, previousSummary = null, onMetricClick }) {
  return (
    <Card sx={{ p: { xs: 1.5, lg: 1.75 }, height: '100%', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <SectionHeader icon="🛡️" title="SYSTEM HEALTH & UPTIME" subtitle="Availability Overview" color="success.main" />

      {/* DSD */}
      <CardActionArea onClick={() => onMetricClick('dsd')} title="Click for site-wise details" sx={{ border: `1px solid ${COLORS.accent}55`, borderRadius: 1.5, px: 1.25, py: 0.9, mb: 1.1 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '28px 1fr auto', sm: '28px minmax(120px,1fr) minmax(110px,1.2fr) auto' }, gap: 1, alignItems: 'center' }}>
          <Box sx={{ width: 28, height: 28, borderRadius: 1, display: 'grid', placeItems: 'center', color: COLORS.accent, bgcolor: `${COLORS.accent}20`, border: `1px solid ${COLORS.accent}66`, '& svg': { fontSize: 16 } }}><SecurityRoundedIcon /></Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={900} sx={{ fontSize: 13, lineHeight: 1.2 }}>DSD Avail.</Typography>
            <Typography sx={{ fontSize: 10, color: 'text.secondary', lineHeight: 1.2 }}>DSD-adjusted uptime of the portfolio</Typography>
          </Box>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}><Progress value={summary.dsd} color={COLORS.accent} /></Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ fontSize: 21, lineHeight: 1.1, fontWeight: 950, color: COLORS.accent }}>{formatPercent(summary.dsd)}</Typography>
            <Typography sx={{ fontSize: 9, color: 'text.secondary', whiteSpace: 'nowrap' }}>{comparison(summary.dsd, previousSummary?.dsd)}</Typography>
          </Box>
        </Box>
      </CardActionArea>

      {/* Adirain hero */}
      <CardActionArea onClick={() => onMetricClick('adirain')} title="Click for site-wise details" sx={{ border: `1px solid ${COLORS.good}66`, borderRadius: 1.5, px: 1.5, py: 1.15, bgcolor: `${COLORS.good}06`, '&:hover': { bgcolor: `${COLORS.good}10`, borderColor: COLORS.good } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 1.25, alignItems: 'center' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 17, lineHeight: 1.2, fontWeight: 950, color: COLORS.good }}>Adirain Availability</Typography>
            <Typography sx={{ fontSize: 10.5, color: 'text.secondary', mt: 0.3, lineHeight: 1.3 }}>Composite availability derived from Data, Inverter and String availability.</Typography>
            <Box sx={{ width: 32, height: 2.5, bgcolor: COLORS.good, borderRadius: 3, my: 0.8 }} />
            <Typography sx={{ fontSize: 10.5, color: 'text.secondary' }}>👆 Click to know more</Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Gauge value={summary.adirainAvailability} />
            <Typography sx={{ fontSize: 9, color: 'text.secondary', whiteSpace: 'nowrap' }}>{comparison(summary.adirainAvailability, previousSummary?.adirainAvailability)}</Typography>
          </Box>
        </Box>
      </CardActionArea>

      {/* Connector */}
      <Box sx={{ height: 24, position: 'relative', display: { xs: 'none', sm: 'block' } }}>
        <Box sx={{ position: 'absolute', left: '50%', top: 0, width: 2, height: 9, bgcolor: COLORS.cyan }} />
        <Box sx={{ position: 'absolute', left: '16.7%', right: '16.7%', top: 8, height: 2, bgcolor: COLORS.cyan }} />
        {[16.7, 50, 83.3].map((left) => <Box key={left} sx={{ position: 'absolute', left: `${left}%`, top: 8, width: 2, height: 10, bgcolor: COLORS.cyan }} />)}
      </Box>

      {/* Children */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0,1fr))' }, gap: 1.15, mt: { xs: 0.9, sm: 0 }, flex: 1 }}>
        <ChildCard title="Data Avail." value={summary.dataAvailability} previous={previousSummary?.dataAvailability} color={COLORS.purple} icon={DataUsageRoundedIcon} description="Expected data points received after QC" onClick={() => onMetricClick('data')} />
        <ChildCard title="Inverter Avail." value={summary.inverterAvailability} previous={previousSummary?.inverterAvailability} color={COLORS.cyan} icon={DeveloperBoardRoundedIcon} description="Inverter operational uptime across the fleet" onClick={() => onMetricClick('inverter')} />
        <ChildCard title="String Avail." value={summary.stringAvailability} previous={previousSummary?.stringAvailability} color={COLORS.warn} icon={CableRoundedIcon} description="Strings up vs. configured strings" onClick={() => onMetricClick('string')} />
      </Box>
    </Card>
  );
}
