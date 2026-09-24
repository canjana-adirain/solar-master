import { Box, Stack, Typography } from '@mui/material';
import { formatNumber, formatPercent } from '../../utils/format.js';
import { impactSummary, impactValue, issueItems } from './impactDetailsData.js';

export default function ImpactDetails({ sites, config }) {
  const summary = impactSummary(sites, config);
  const summaryCards = config.impact ? [
    ['ISSUE COUNT', formatNumber(summary.count), config.color],
    ['AVG SITE IMPACT', formatPercent(summary.average), config.color],
    ['MAX SITE IMPACT', formatPercent(summary.max), '#fb8383'],
  ] : [
    ['ISSUE COUNT', formatNumber(summary.count), config.color],
    ['AFFECTED SITES', formatNumber(summary.siteCount), config.color],
    ['MAX ISSUES AT ONE SITE', formatNumber(summary.maxCount), config.color],
  ];
  return <>
    <Typography sx={{ mb: 1.6, color: 'text.secondary', fontWeight: 600 }}>
      {formatNumber(summary.count)} {config.noun} across {summary.siteCount} site{summary.siteCount === 1 ? '' : 's'}{config.impact ? ' — showing the recorded impact of each, where available.' : '.'}
    </Typography>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.2, mb: 1.6 }}>
      {summaryCards.map(([label, value, color]) => <Box key={label} sx={{ p: 1.4, border: 1, borderColor: 'divider', borderRadius: 1.5, bgcolor: 'action.hover' }}>
        <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ letterSpacing: 0.7 }}>{label}</Typography>
        <Typography sx={{ fontSize: 25, fontWeight: 900, color, lineHeight: 1.3 }}>{value}</Typography>
      </Box>)}
    </Box>
    <Stack spacing={1.2}>
      {sites.length ? sites.map((site, index) => {
        const items = issueItems(site, config);
        return <Box key={`${site.site}-${index}`} sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1.5, bgcolor: 'action.hover' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
            <Typography fontWeight={850} sx={{ fontSize: 16 }}>{site.site}</Typography>
            <Typography fontWeight={900} sx={{ color: config.color }}>{formatNumber(site[config.key])}</Typography>
          </Stack>
          {items.length ? <Stack spacing={0.65} sx={{ mt: 1 }}>
            {items.map((item, itemIndex) => <Typography key={itemIndex} variant="body2" sx={{ pl: 1.3, borderLeft: `3px solid ${config.color}`, overflowWrap: 'anywhere' }}>
              ▸ {item.text}{item.impact == null ? '' : <Box component="span" sx={{ color: config.color, fontWeight: 800 }}> — {formatPercent(item.impact)}</Box>}
            </Typography>)}
          </Stack> : <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Individual issue details were not provided in the uploaded data.</Typography>}
          {config.impact && <Typography variant="caption" sx={{ display: 'inline-block', mt: 1, px: 1, py: 0.3, border: `1px solid ${config.color}77`, borderRadius: 1, color: config.color, fontWeight: 800 }}>
            {config.impactLabel}: {formatPercent(impactValue(site, config))}
          </Typography>}
        </Box>;
      }) : <Typography color="text.secondary" align="center" sx={{ py: 4 }}>No sites match this detail.</Typography>}
    </Stack>
  </>;
}
