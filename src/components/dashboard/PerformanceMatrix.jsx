import { useRef } from 'react';
import { Box, Card, CardActionArea, Chip, Divider, Stack, Typography } from '@mui/material';
import { GRADE_COLOR } from '../../constants.js';
import { formatPercent } from '../../utils/format.js';
import { gradeCounts } from '../../utils/analytics.js';
import DownloadButtons from '../common/DownloadButtons.jsx';

const gradeMeta = {
  5: ['Excellent', '≥95%', '🏆'],
  4: ['Good', '90–95%', '✅'],
  3: ['Fair', '80–90%', '⚖️'],
  2: ['Poor', '70–80%', '⚠️'],
  1: ['Critical', '<70%', '🛡️'],
};

export default function PerformanceMatrix({
  sites,
  summary,
  onGradeClick,
  onExcel,
  onPdf,
}) {
  const ref = useRef(null);
  const counts = gradeCounts(sites);

  const pe = Number(summary.averageActualExpected || 0);
  const specificYield = Number(summary.specificYield || 0);

  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const dashArray = `${Math.max(
    0,
    Math.min(1, pe)
  ) * circumference} ${circumference}`;

  return (
    <Card ref={ref} sx={{ p: 2, height: '100%' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 2,
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2,
            background:
              'linear-gradient(135deg,#0ea5e9,#2563eb)',
            display: 'grid',
            placeItems: 'center',
            fontSize: 22,
          }}
        >
          📈
        </Box>

        <Box>
          <Typography
            sx={{
              fontSize: 17,
              fontWeight: 800,
            }}
          >
            PERFORMANCE MATRIX
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            Portfolio production vs. weather-adjusted
            expectation, specific yield &amp; grade
            distribution
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto', alignSelf: 'flex-start', flexShrink: 0 }}>
          <DownloadButtons compact onExcel={onExcel} onPdf={() => onPdf(ref.current)} />
        </Box>
      </Box>

      {/* Top Section */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: '1fr 1fr',
          },
          gap: 3,
          mb: 2,
        }}
      >
        {/* Gauge */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              width: 200,
              height: 200,
              position: 'relative',
            }}
          >
            <svg
              width="200"
              height="200"
              viewBox="0 0 200 200"
            >
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="#1c2b45"
                strokeWidth="14"
              />

              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={
                  pe >= 0.95
                    ? '#22c55e'
                    : pe >= 0.9
                    ? '#a3e635'
                    : '#f59e0b'
                }
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={dashArray}
                transform="rotate(-90 100 100)"
              />
            </svg>

            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                textAlign: 'center',
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontSize: 40,
                    fontWeight: 900,
                    color:
                      pe >= 0.95
                        ? '#22c55e'
                        : pe >= 0.9
                        ? '#a3e635'
                        : '#f59e0b',
                  }}
                >
                  {formatPercent(pe)}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Production / Expected
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Specific Yield */}
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            textAlign: 'center',
          }}
        >
          <Box>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                border:
                  '2px solid rgba(47,129,247,.5)',
                display: 'grid',
                placeItems: 'center',
                mx: 'auto',
                mb: 1,
                fontSize: 28,
              }}
            >
              ☀️
            </Box>

            <Typography
              sx={{
                color: '#3b82f6',
                fontWeight: 700,
              }}
            >
              kWh/kWp (period)
            </Typography>

            <Typography
              sx={{
                fontSize: 44,
                fontWeight: 900,
                color: '#3b82f6',
                lineHeight: 1,
              }}
            >
              {specificYield > 0
                ? specificYield.toFixed(2)
                : '—'}
            </Typography>

            <Typography
              sx={{
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              Specific Yield
            </Typography>
          </Box>
        </Box>
      </Box>

    <Divider sx={{ mb: 1 }} />

<Stack spacing={1}>
  {[5, 4, 3, 2, 1].map((grade) => (
    <CardActionArea
      key={grade}
      onClick={() => onGradeClick(grade)}
      sx={{
        borderRadius: 2,
        border: `1px solid ${GRADE_COLOR[grade]}55`,
        p: 1.2,
        '&:hover': {
          bgcolor: `${GRADE_COLOR[grade]}14`,
          borderColor: GRADE_COLOR[grade],
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box
          sx={{
            width: 11,
            height: 11,
            borderRadius: '50%',
            bgcolor: GRADE_COLOR[grade],
            boxShadow: `0 0 0 4px ${GRADE_COLOR[grade]}22`,
          }}
        />
        <Typography variant="body2" fontWeight={700} flex={1}>
          {gradeMeta[grade][0]}
        </Typography>
       <Typography
  variant="caption"
  sx={{
    minWidth: 70,
    textAlign: 'right',
    fontWeight: 700,
    color: GRADE_COLOR[grade],
  }}
>
  {(() => {
    const gradeSites = sites.filter(
      (site) => site.grade === grade
    );

    if (!gradeSites.length) return '—';

    const avgPE =
      gradeSites.reduce(
        (sum, site) => sum + (Number(site.ae) || 0),
        0
      ) / gradeSites.length;

   return (
  <>
    <span
      style={{
        color: '#A7B1C2',
        fontWeight: 600,
      }}
    >
      Avg P/E
    </span>{' '}
    <span
      style={{
        color: GRADE_COLOR[grade],
        fontWeight: 800,
      }}
    >
      {Math.round(avgPE * 100)}%
    </span>
  </>
);
  })()}
</Typography>
        <Chip
          size="small"
          label={`${counts[grade]} site${counts[grade] === 1 ? '' : 's'}`}
          sx={{
            color: GRADE_COLOR[grade],
            fontWeight: 800,
          }}
        />
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 2.4, mt: 0.3 }}>
        👆 Click for details
      </Typography>
    </CardActionArea>
  ))}
</Stack>

      <Divider sx={{ my: 2 }} />

      <Typography
        variant="caption"
        color="text.secondary"
      >
        P/E Grade bands: <b>5 Excellent ≥95%</b> ·{' '}
        <b>4 Good 90–95%</b> · <b>3 Fair 80–90%</b> ·{' '}
        <b>2 Poor 70–80%</b> · <b>1 Critical &lt;70%</b>
        {' '}— P/E % = Production ÷ Weather Adjusted
        Expectation
      </Typography>
    </Card>
  );
}
// const gradeMeta = {
//   5: ['Excellent', '≥ 95%'], 4: ['Good', '90–95%'], 3: ['Fair', '80–90%'], 2: ['Poor', '60–80%'], 1: ['Critical', '< 60%'],
// };

// export default function PerformanceMatrix({ sites, summary, onGradeClick }) {
//   const counts = gradeCounts(sites);
//   return (
//     <Card sx={{ p: 1.75, height: '100%' }}>
//       <SectionHeader icon="📊" title="PERFORMANCE MATRIX" subtitle="Actual / Expected energy" />
//       <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 1.5 }}>
//         <Typography sx={{ fontSize: 36, fontWeight: 900, color: summary.averageActualExpected >= 0.95 ? 'success.light' : 'warning.main' }}>{formatPercent(summary.averageActualExpected)}</Typography>
//         <Typography variant="caption" color="text.secondary">portfolio average</Typography>
//       </Stack>
//       <Divider sx={{ mb: 1 }} />
//       <Stack spacing={0.5}>
//         {[5, 4, 3, 2, 1].map((grade) => (
//           <CardActionArea key={grade} onClick={() => onGradeClick(grade)} sx={{ borderRadius: 1.5, p: 0.85, '&:hover': { bgcolor: `${GRADE_COLOR[grade]}14` } }}>
//             <Stack direction="row" alignItems="center" spacing={1}>
//               <Box sx={{ width: 11, height: 11, borderRadius: '50%', bgcolor: GRADE_COLOR[grade], boxShadow: `0 0 0 4px ${GRADE_COLOR[grade]}22` }} />
//               <Typography variant="body2" fontWeight={700} flex={1}>{gradeMeta[grade][0]}</Typography>
//               <Typography variant="caption" color="text.secondary">{gradeMeta[grade][1]}</Typography>
//               <Chip size="small" label={`${counts[grade]} site${counts[grade] === 1 ? '' : 's'}`} sx={{ color: GRADE_COLOR[grade], fontWeight: 800 }} />
//             </Stack>
//           </CardActionArea>
//         ))}
//       </Stack>
//     </Card>
//   );
// }
