import CableRoundedIcon from '@mui/icons-material/CableRounded';
import DataUsageRoundedIcon from '@mui/icons-material/DataUsageRounded';
import DeveloperBoardRoundedIcon from '@mui/icons-material/DeveloperBoardRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import StarsRoundedIcon from '@mui/icons-material/StarsRounded';
import { Box, Card, CardActionArea, LinearProgress, Stack, Typography } from '@mui/material';
import { COLORS } from '../../constants.js';
import { formatPercent } from '../../utils/format.js';
import SectionHeader from '../common/SectionHeader.jsx';

const rows = (summary) => [
  { label: 'DSD Avail.', value: summary.dsd, icon: SecurityRoundedIcon, color: COLORS.accent, detail: 'DSD-adjusted uptime of the portfolio', key: 'dsd' },
  { label: 'Adirain Avail.', value: summary.adirainAvailability, icon: StarsRoundedIcon, color: COLORS.good, detail: 'Composite = Data × Inverter × String availability', key: 'adirain' },
  { label: 'Data Avail.', value: summary.dataAvailability, icon: DataUsageRoundedIcon, color: COLORS.purple, detail: 'Share of expected data points received after QC', key: 'data' },
  { label: 'Inverter Avail.', value: summary.inverterAvailability, icon: DeveloperBoardRoundedIcon, color: COLORS.cyan, detail: 'Inverter operational uptime across the fleet', key: 'inverter' },
  { label: 'String Avail.', value: summary.stringAvailability, icon: CableRoundedIcon, color: COLORS.warn, detail: 'Strings up vs. configured strings', key: 'string' },
];

export default function HealthCard({ summary, onMetricClick }) {
  return (
    <Card
      sx={{
        p: 1.75,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <SectionHeader icon="🛡️" title="SYSTEM HEALTH & UPTIME" subtitle="Availability Overview" color="success.main" />
      <Stack
        spacing={1.25}
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
        }}
      >
        {rows(summary).map(({ label, value, icon: Icon, color, detail, key }) => {
          const percentage = Math.max(0, Math.min(100, value * 100));
          const stateColor = percentage >= 95 ? COLORS.good : percentage >= 90 ? COLORS.warn : COLORS.bad;

          return (
            <CardActionArea
              key={key}
              onClick={() => onMetricClick(key)}
              sx={{
                borderRadius: 2,
                border: `1px solid ${color}66`,
                px: 1.25,
                py: 0.75,
                minHeight: 78,
                display: 'flex',
                alignItems: 'center',
                flex: 1,
                width: '100%',
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  display: 'grid',
                  gridTemplateColumns: '34px minmax(150px, 1.1fr) minmax(150px, 1.5fr) auto',
                  columnGap: 2,
                  alignItems: 'center',
                  minWidth: 0,
                }}
              >
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: 1.75,
                    bgcolor: `${color}22`,
                    color,
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon fontSize="small" />
                </Box>

                <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="body2" fontWeight={800} lineHeight={1.2}>
                    {label}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: { xs: 'none', sm: 'block' },
                      lineHeight: 1.2,
                      mt: 0.15,
                    }}
                  >
                    {detail}
                  </Typography>
                </Box>

                <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <LinearProgress
                    variant="determinate"
                    value={percentage}
                    sx={{
                      height: 6,
                      width: '100%',
                      borderRadius: 4,
                      bgcolor: 'action.hover',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: stateColor,
                      },
                    }}
                  />
                </Box>

                <Typography fontWeight={900} color={stateColor} sx={{ minWidth: 62, textAlign: 'right', lineHeight: 1.2 }}>
                  {formatPercent(value)}
                </Typography>
              </Box>
            </CardActionArea>
          );
        })}
      </Stack>
    </Card>
  );
}
