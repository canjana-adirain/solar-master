import { Box, Stack, Typography } from '@mui/material';
import { COLORS } from '../../constants.js';
import { cleanText, formatNumber, formatPercent } from '../../utils/format.js';
import { inverterBreakdown, stringAvailability } from './stringAvailabilityData.js';

export default function StringAvailabilityDetails({ sites }) {
  return <Stack spacing={1}>
    {sites.length ? sites.map((site, index) => {
      const total = Number(site.total_strings) || 0;
      const down = Math.max(0, Number(site.str_cnt) || 0);
      const breakdown = inverterBreakdown(site);
      return <Box key={`${site.site}-${index}`} sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, p: 1.25, bgcolor: 'action.hover' }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Typography fontWeight={800}>{site.site}</Typography>
          <Typography fontWeight={900} color={stringAvailability(site) >= 0.95 ? COLORS.good : COLORS.warn}>{formatPercent(stringAvailability(site))}</Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3 }}>
          Strings up <b>{total > 0 ? `${formatNumber(Math.max(0, total - down))} / ${formatNumber(total)}` : '—'}</b> · down <b>{formatNumber(down)}</b> · Inverters <b>{formatNumber(site.tot_inv)}</b> · DC <b>{formatNumber(site.dc)} kW</b>
        </Typography>
        {breakdown.length > 0 && <Stack spacing={0.35} sx={{ mt: 0.8, pl: 1, borderLeft: `2px solid ${COLORS.warn}` }}>
          {breakdown.map(({ label, count }) => <Typography key={label} variant="caption">▸ {label} — <b>{count} string{count === 1 ? '' : 's'}</b> down</Typography>)}
        </Stack>}
        {!breakdown.length && down > 0 && cleanText(site.str_txt) && <Typography variant="caption" sx={{ display: 'block', mt: 0.7 }}>{cleanText(site.str_txt)}</Typography>}
      </Box>;
    }) : <Typography color="text.secondary" align="center" sx={{ py: 5 }}>No sites match this detail.</Typography>}
  </Stack>;
}
