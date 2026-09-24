import { useMemo, useRef } from 'react';
import {
  Box, Card, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import { COLORS } from '../../constants.js';
import { exportElementPdf, exportWorkbook } from '../../utils/export.js';
import DownloadButtons from '../common/DownloadButtons.jsx';
import SectionHeader from '../common/SectionHeader.jsx';

const failureColumns = [
  { key: 'mppt_cnt', label: 'RSD', color: COLORS.purple },
  { key: 'str_cnt', label: 'String', color: COLORS.pink },
  { key: 'bd_cnt', label: 'Inverter', color: COLORS.warn },
  { key: 'comms_cnt', label: 'Comms', color: COLORS.cyan },
];

function FailureValue({ value, color }) {
  const count = Number(value) || 0;
  if (!count) {
    return <Chip size="small" label="—" variant="outlined" sx={{ height: 22, minWidth: 34, color: 'text.disabled', borderColor: 'divider' }} />;
  }
  return <Chip size="small" label={count} sx={{ height: 22, minWidth: 34, bgcolor: `${color}28`, color, border: `1px solid ${color}66`, fontWeight: 900 }} />;
}

export default function EquipmentFailureTable({ sites, roundName, onSiteClick }) {
  const tableRef = useRef(null);
  const rows = useMemo(() => [...sites].sort((left, right) => {
    const total = (site) => failureColumns.reduce((sum, column) => sum + (Number(site[column.key]) || 0), 0);
    return total(right) - total(left) || left.site.localeCompare(right.site);
  }), [sites]);

  const exportExcel = () => exportWorkbook(
    `Sites by equipment failure · ${roundName}`,
    ['Site', ...failureColumns.map((column) => column.label)],
    rows.map((site) => [site.site, ...failureColumns.map((column) => Number(site[column.key]) || 0)]),
    `Sites_by_equipment_failure_${roundName}`,
  );

  const exportPdf = () => exportElementPdf(
    tableRef.current,
    `Sites_by_equipment_failure_${roundName}`,
    `Sites by equipment failure · ${roundName}`,
  );

  return (
    <Card sx={{ p: 1.75, mb: 1.5 }}>
      <SectionHeader
        color="warning.main"
        title="Sites by equipment failure"
        subtitle="One row per filtered site — flags show active failure types"
        action={<DownloadButtons onExcel={exportExcel} onPdf={exportPdf} />}
      />
      <TableContainer ref={tableRef} sx={{ maxHeight: 420, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
        <Table stickyHeader size="small" sx={{ minWidth: 620 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'primary.light', fontWeight: 900 }}>Site</TableCell>
              {failureColumns.map((column) => <TableCell key={column.key} align="center" sx={{ fontWeight: 900 }}>{column.label}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((site) => (
              <TableRow
                hover key={site.site}
                onClick={() => onSiteClick?.(site)}
                sx={{ cursor: onSiteClick ? 'pointer' : 'default' }}
              >
                <TableCell><Typography variant="body2" fontWeight={600}>{site.site}</Typography></TableCell>
                {failureColumns.map((column) => (
                  <TableCell key={column.key} align="center">
                    <FailureValue value={site[column.key]} color={column.color} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {!rows.length && <Box sx={{ py: 4, textAlign: 'center' }}><Typography color="text.secondary">No sites match the current filters.</Typography></Box>}
    </Card>
  );
}
