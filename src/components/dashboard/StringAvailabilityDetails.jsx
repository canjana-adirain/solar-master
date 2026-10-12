import { useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { COLORS } from '../../constants.js';
import { cleanText, formatNumber, formatPercent } from '../../utils/format.js';
import { inverterBreakdown, stringAvailability } from './stringAvailabilityData.js';

const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));
const availabilityColor = (value) => (value >= 0.95 ? COLORS.good : value >= 0.9 ? COLORS.warn : COLORS.bad);

function inverterWiseStringRows(site) {
  const totalInverters = Math.max(0, Math.round(Number(site.tot_inv) || 0));
  const breakdown = inverterBreakdown(site);
  const breakdownMap = new Map(breakdown.map(({ label, count }) => [String(label).toUpperCase(), Number(count) || 0]));
  const estimatedStringsPerInverter = totalInverters > 0 && Number(site.total_strings) > 0
    ? Math.max(1, Math.round(Number(site.total_strings) / totalInverters))
    : 0;

  if (!totalInverters) {
    return breakdown.map(({ label, count }) => ({
      label,
      value: clamp01(stringAvailability(site)),
      note: `${count} string${count === 1 ? '' : 's'} down`,
    }));
  }

  return Array.from({ length: totalInverters }, (_, index) => {
    const label = `INV ${index + 1}`;
    const down = breakdownMap.get(label) || 0;
    const value = estimatedStringsPerInverter
      ? clamp01((estimatedStringsPerInverter - down) / estimatedStringsPerInverter)
      : (down > 0 ? clamp01(stringAvailability(site) - 0.1 * down) : 1);
    const note = estimatedStringsPerInverter
      ? `Strings up ${Math.max(0, estimatedStringsPerInverter - down)} / ${estimatedStringsPerInverter}`
      : (down > 0 ? `${down} string${down === 1 ? '' : 's'} down` : 'No strings down');
    return { label, value, note };
  });
}

export default function StringAvailabilityDetails({ sites }) {
  const [expandedSite, setExpandedSite] = useState(null);
  return <Stack spacing={1}>
    {sites.length ? sites.map((site, index) => {
      const total = Number(site.total_strings) || 0;
      const down = Math.max(0, Number(site.str_cnt) || 0);
      const breakdown = inverterBreakdown(site);
      const isExpanded = expandedSite === index;
      const perInverterRows = inverterWiseStringRows(site);
      return <Box key={`${site.site}-${index}`} sx={{ border: 1, borderColor: isExpanded ? COLORS.accent : 'divider', borderRadius: 1.5, p: 1.25, bgcolor: 'action.hover' }}>
        <Box role="button" tabIndex={0} aria-expanded={isExpanded}
          onClick={() => setExpandedSite(isExpanded ? null : index)}
          onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setExpandedSite(isExpanded ? null : index); } }}
          sx={{ cursor: 'pointer' }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
            <Typography fontWeight={800}>{isExpanded ? '▾ ' : '▸ '}{site.site}</Typography>
            <Typography fontWeight={900} color={stringAvailability(site) >= 0.95 ? COLORS.good : COLORS.warn}>{formatPercent(stringAvailability(site))}</Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3 }}>
            Strings up <b>{total > 0 ? `${formatNumber(Math.max(0, total - down))} / ${formatNumber(total)}` : '—'}</b> · Inverters <b>{formatNumber(site.tot_inv)}</b> · DC <b>{formatNumber(site.dc)} kW</b>
          </Typography>
        </Box>
        {isExpanded && perInverterRows.length > 0 && (
          <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
            <Stack spacing={0.8}>
              {perInverterRows.map(({ label, value, note }) => {
                const color = availabilityColor(value);
                return (
                  <Box key={label} sx={{ display: 'grid', gridTemplateColumns: 'minmax(96px, 140px) 1fr auto', gap: 1, alignItems: 'center' }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={700}>{label}</Typography>
                      <Typography variant="caption" color="text.secondary">{note}</Typography>
                    </Box>
                    <Box sx={{ height: 8, borderRadius: 999, overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.08)' }}>
                      <Box sx={{ width: `${clamp01(value) * 100}%`, height: '100%', bgcolor: color, borderRadius: 999 }} />
                    </Box>
                    <Typography variant="body2" fontWeight={900} sx={{ color, minWidth: 56, textAlign: 'right' }}>{formatPercent(value)}</Typography>
                  </Box>
                );
              })}
            </Stack>
            {!breakdown.length && down > 0 && cleanText(site.str_txt) && <Typography variant="caption" sx={{ display: 'block', mt: 0.9 }}>{cleanText(site.str_txt)}</Typography>}
          </Box>
        )}
      </Box>;
    }) : <Typography color="text.secondary" align="center" sx={{ py: 5 }}>No sites match this detail.</Typography>}
  </Stack>;
}
