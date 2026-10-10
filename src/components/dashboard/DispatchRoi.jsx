import { useMemo, useRef } from 'react';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import { Box, Button, Card, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { formatNumber, safeFilename } from '../../utils/format.js';
import { PAYBACK_BANDS, buildRoiRows, hasRoiData, summarizeRoi } from '../../utils/roi.js';
import DownloadButtons from '../common/DownloadButtons.jsx';
import SectionHeader from '../common/SectionHeader.jsx';
import './chartSetup.js';

const ROW_HEIGHT = 30;     // px per site bar
const VISIBLE_ROWS = 10;   // top 10 visible, rest via scroll
const AXIS_SPACE = 34;     // x-axis (pinned on top)

const money = (value, digits = 2) => `$${formatNumber(value, digits)}`;
const days = (row) => (row.payback == null ? 'No Loss' : formatNumber(Math.round(row.payback)));

export default function DispatchRoi({ sites, roundName, onRoiClick, onExcel, onPdf }) {
  const theme = useTheme();
  const cardRef = useRef(null);
  const chartRef = useRef(null);

  const rows = useMemo(() => buildRoiRows(sites), [sites]);
  const chartRows = useMemo(() => rows.filter((row) => row.payback != null), [rows]);
  const summary = useMemo(() => summarizeRoi(rows), [rows]);
  const dispatchCost = rows[0]?.dispatchCost ?? 0;
  const bg = theme.palette.background.paper;

  const plugins = useMemo(() => [
    {
      id: 'roiBackground',
      beforeDraw(chart) {
        const { ctx, width, height } = chart;
        ctx.save(); ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height); ctx.restore();
      },
    },
    {
      id: 'roiValueLabels',
      afterDatasetsDraw(chart) {
        const { ctx } = chart;
        const meta = chart.getDatasetMeta(0);
        ctx.save();
        ctx.textBaseline = 'middle';
        meta.data.forEach((bar, index) => {
          const row = chartRows[index];
          if (!row) return;
          ctx.font = '800 10.5px Segoe UI';
          ctx.fillStyle = theme.palette.text.primary;
          const label = `${days(row)} d`;
          ctx.fillText(label, bar.x + 6, bar.y);
          const width = ctx.measureText(label).width;
          ctx.font = '600 10px Segoe UI';
          ctx.fillStyle = theme.palette.text.secondary;
          ctx.fillText(`· ${money(row.financialLoss, 0)}`, bar.x + 12 + width, bar.y);
        });
        ctx.restore();
      },
    },
  ], [bg, chartRows, theme]);

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    layout: { padding: { right: 92 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => chartRows[items[0].dataIndex]?.site.site,
          label: () => '',
          afterBody: (items) => {
            const row = chartRows[items[0].dataIndex];
            if (!row) return [];
            return [
              `Payback: ${days(row)} days`,
              `Financial loss: ${money(row.financialLoss)}`,
              'Click for site ROI details',
            ];
          },
        },
      },
    },
    scales: {
      x: {
        position: 'top',
        beginAtZero: true,
        title: { display: true, text: 'Payback period (days)', color: theme.palette.text.secondary, font: { size: 10.5, weight: 700 } },
        ticks: { color: theme.palette.text.secondary, font: { size: 10 } },
        grid: { color: theme.palette.divider },
      },
      y: {
        ticks: {
          color: theme.palette.text.primary,
          font: { size: 10.5, weight: 600 },
          autoSkip: false,
          callback(value) { const label = this.getLabelForValue(value); return label.length > 28 ? `${label.slice(0, 27)}…` : label; },
        },
        grid: { display: false },
      },
    },
    onClick: (_, elements) => elements[0] && onRoiClick?.(chartRows[elements[0].index]),
    onHover: (event, elements) => { if (event.native?.target) event.native.target.style.cursor = elements.length ? 'pointer' : 'default'; },
  };

  const downloadPng = () => {
    const chart = chartRef.current;
    if (!chart) return;
    const link = document.createElement('a');
    link.href = chart.toBase64Image('image/png', 1);
    link.download = `${safeFilename(`DispatchROI_Payback_${roundName}`)}.png`;
    link.click();
  };

  const kpis = [
    ['DISPATCH COST', money(dispatchCost, 0), '#2f81f7', 'Fixed for every site'],
    ['FINANCIAL LOSS', money(summary.totalLoss, 0), '#ef4444', `${formatNumber(summary.totalEnergy, 0)} kWh lost`],
    ['SITES WITH LOSS', `${summary.sitesWithLoss} / ${summary.sites}`, '#f59e0b', 'Need a dispatch'],
    ['DISPATCH NOW', formatNumber(summary.dispatchNow), '#ef4444', 'Payback ≤ 30 days'],
  ];

  if (!hasRoiData(sites)) {
    return (
      <Card sx={{ p: 1.25, height: '100%' }}>
        <SectionHeader icon="💰" color="success.main" title="DISPATCH ROI — Site-wise Payback" />
        <Typography variant="body2" color="text.secondary">
          No ROI data in this round. Upload a workbook whose Summary sheet contains PPA, Repair cost, String/Inverter Breakdown Loss in kWh, Financial loss and Payback Period (columns AN–AS).
        </Typography>
      </Card>
    );
  }

  const chartHeight = chartRows.length * ROW_HEIGHT + AXIS_SPACE + 10;
  const viewportHeight = Math.min(chartHeight, VISIBLE_ROWS * ROW_HEIGHT + AXIS_SPACE + 10);

  return (
    <Card ref={cardRef} sx={{ p: 1.25, height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <SectionHeader
        icon="💰"
        color="success.main"
        title="DISPATCH ROI — Site-wise Payback"
        action={(
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Tooltip title="Download the chart as PNG for client reports">
              <Button size="small" variant="outlined" startIcon={<ImageOutlinedIcon />} onClick={downloadPng} data-no-print="true" sx={{ py: 0.2 }}>PNG</Button>
            </Tooltip>
            <DownloadButtons compact onExcel={() => onExcel(rows)} onPdf={() => onPdf(cardRef.current)} />
          </Stack>
        )}
      />

      {/* KPIs */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 0.6, mb: 0.8 }}>
        {kpis.map(([label, value, color, note]) => (
          <Box key={label} sx={{ px: 0.9, py: 0.5, border: `1px solid ${color}55`, borderRadius: 1.25, bgcolor: `${color}0d`, minWidth: 0 }}>
            <Typography noWrap sx={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.4, color: 'text.secondary' }}>{label}</Typography>
            <Typography noWrap sx={{ fontSize: 17, fontWeight: 900, color, lineHeight: 1.2 }}>{value}</Typography>
            <Typography noWrap sx={{ fontSize: 9.5, color: 'text.secondary' }}>{note}</Typography>
          </Box>
        ))}
      </Box>

      {/* Legend */}
      <Stack direction="row" gap={1.25} flexWrap="wrap" sx={{ mb: 0.5 }}>
        {PAYBACK_BANDS.map((band) => (
          <Typography key={band.key} sx={{ fontSize: 10, color: 'text.secondary', whiteSpace: 'nowrap' }}>
            <Box component="span" sx={{ display: 'inline-block', width: 9, height: 9, borderRadius: 0.5, bgcolor: band.color, mr: 0.5 }} />{band.label}
          </Typography>
        ))}
      </Stack>

      {/* Chart: top 10 visible, the rest scroll */}
      {chartRows.length ? (
        <Box sx={{ flex: 1, minHeight: 0, border: 1, borderColor: 'divider', borderRadius: 1.5, p: 0.75 }}>
          <Box sx={{ height: viewportHeight, overflowY: chartRows.length > VISIBLE_ROWS ? 'auto' : 'hidden', overflowX: 'hidden', pr: 0.5 }}>
            <Box sx={{ height: chartHeight, position: 'relative' }}>
              <Bar
                ref={chartRef}
                data={{
                  labels: chartRows.map((row) => row.site.site),
                  datasets: [{
                    label: 'Payback (days)',
                    data: chartRows.map((row) => Math.round(row.payback)),
                    backgroundColor: chartRows.map((row) => row.band.color),
                    borderRadius: 3,
                    barThickness: 16,
                  }],
                }}
                options={options}
                plugins={plugins}
              />
            </Box>
          </Box>
        </Box>
      ) : (
        <Typography color="text.secondary" align="center" sx={{ py: 6 }}>No site has a breakdown loss in this selection.</Typography>
      )}

      <Typography sx={{ mt: 0.6, fontSize: 9.5, color: 'text.secondary' }}>
        {chartRows.length > VISIBLE_ROWS ? `Showing fastest 10 of ${chartRows.length} — scroll for more · ` : ''}
        {summary.sites - summary.sitesWithLoss} sites with no loss hidden · Click a bar for site ROI details · Payback = dispatch cost ÷ daily financial loss
      </Typography>
    </Card>
  );
}
