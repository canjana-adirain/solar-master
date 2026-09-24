import { useRef, useState } from 'react';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import {
  Alert, Box, Button, Card, Chip, IconButton, LinearProgress, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { mapHeader, parsePortfolioFile } from '../utils/fileParser.js';
import { formatNumber } from '../utils/format.js';
import SectionHeader from '../components/common/SectionHeader.jsx';

function RoundLibrary({ rounds, activeRoundId, onProject, onDelete }) {
  return (
    <Card sx={{ p: 1.75, mb: 1.5 }}>
      <SectionHeader icon="📁" color="secondary.main" title="Rounds Library" action={<Chip size="small" label={`${rounds.length} saved`} />} />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>Save each round’s analysis sheet here, then project any round to the dashboard. Rounds persist in this browser.</Typography>
      <Stack spacing={0.8}>
        {rounds.map((round) => (
          <Box key={round.id} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr auto', sm: '1fr auto auto auto' }, gap: 1, alignItems: 'center', p: 1, border: 1, borderColor: round.id === activeRoundId ? 'primary.main' : 'divider', borderRadius: 1.5, bgcolor: round.id === activeRoundId ? 'primary.main' : 'transparent', color: round.id === activeRoundId ? 'primary.contrastText' : 'inherit' }}>
            <Box minWidth={0}><Typography fontWeight={900} noWrap>{round.name}</Typography><Typography variant="caption" sx={{ opacity: 0.8 }}>{round.sites.length} sites · {round.source || 'uploaded file'} · {new Date(round.addedAt).toLocaleString()}</Typography></Box>
            {round.dateRange && <Chip size="small" label={round.dateRange.replace(/\s+to\s+/i, ' – ')} />}
            <Button size="small" variant={round.id === activeRoundId ? 'outlined' : 'contained'} color={round.id === activeRoundId ? 'inherit' : 'primary'} startIcon={<PlayArrowRoundedIcon />} onClick={() => onProject(round.id)}>Project</Button>
            <IconButton size="small" color="error" aria-label={`Delete ${round.name}`} onClick={() => onDelete(round.id)}><DeleteOutlineRoundedIcon /></IconButton>
          </Box>
        ))}
        {!rounds.length && <Typography color="text.secondary" align="center" sx={{ py: 2 }}>No saved rounds yet.</Typography>}
      </Stack>
    </Card>
  );
}

export default function UploadPage({ rounds, activeRoundId, onAddRound, onProject, onDelete, onLoadNow }) {
  const inputRef = useRef(null);
  const [parsed, setParsed] = useState(null);
  const [roundName, setRoundName] = useState('');
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setBusy(true); setStatus({ severity: 'info', message: `Reading ${file.name}…` });
    try {
      const result = await parsePortfolioFile(file);
      setParsed(result);
      setRoundName(`Round ${rounds.length + 1}`);
      setStatus({ severity: 'success', message: `${result.sites.length} sites parsed from “${result.sheet}”.` });
    } catch (error) {
      setParsed(null);
      setStatus({ severity: 'error', message: error.message || 'Could not read this file.' });
    } finally { setBusy(false); }
  };

  const add = () => {
    if (!parsed) return;
    onAddRound({ ...parsed, name: roundName });
    setStatus({ severity: 'success', message: `${roundName || `Round ${rounds.length + 1}`} was added to the rounds library and projected.` });
  };

  const mapping = parsed ? Object.entries(parsed.columnMap).map(([index, key]) => ({ header: parsed.preview?.[0]?.[index] || `Column ${Number(index) + 1}`, key })) : [];

  return (
    <Box sx={{ maxWidth: 1180, mx: 'auto' }}>
      <Card sx={{ p: { xs: 2, sm: 2.5 }, mb: 1.5, background: 'linear-gradient(135deg, rgba(47,129,247,.18), rgba(6,182,212,.10))' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <Box sx={{ width: 54, height: 54, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: 'primary.main', color: '#fff' }}><CloudUploadRoundedIcon fontSize="large" /></Box>
          <Box flex={1}><Typography variant="h2">Upload Round Data</Typography><Typography color="text.secondary">Upload your portfolio analysis Excel file to process and update the dashboard.</Typography></Box>
          <Stack direction="row" spacing={1} alignItems="center"><SecurityRoundedIcon color="success" /><Box><Typography fontWeight={900}>Secure Upload</Typography><Typography variant="caption" color="text.secondary">Files are processed locally in your browser.</Typography></Box></Stack>
        </Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 1, md: 5 }} mt={2} pt={1.5} borderTop={1} borderColor="divider">
          <Typography variant="caption" color="text.secondary"><b>SUPPORTED FILE TYPES</b><br />Excel files (.xlsx, .xlsm, .csv) · Max 50MB</Typography>
          <Typography variant="caption" color="text.secondary"><b>AUTOMATIC PROCESSING</b><br />Data validation · Impact calculation · Dashboard update</Typography>
        </Stack>
      </Card>

      <RoundLibrary rounds={rounds} activeRoundId={activeRoundId} onProject={onProject} onDelete={onDelete} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 1.5 }}>
        <Box>
          <Card
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
            onDrop={(event) => { event.preventDefault(); setDragging(false); handleFile(event.dataTransfer.files[0]); }}
            onClick={() => inputRef.current?.click()}
            sx={{ p: 4, textAlign: 'center', cursor: 'pointer', border: 2, borderStyle: 'dashed', borderColor: dragging ? 'primary.main' : 'divider', bgcolor: dragging ? 'primary.main' : 'transparent', color: dragging ? 'primary.contrastText' : 'inherit', transition: '.15s' }}
          >
            <CloudUploadRoundedIcon sx={{ fontSize: 45 }} />
            <Typography variant="h2" sx={{ mt: 0.5 }}>Upload a round analysis sheet</Typography>
            <Typography variant="body2" color={dragging ? 'inherit' : 'text.secondary'} sx={{ mt: 0.75 }}>Drop an Excel workbook or CSV export here. The dashboard reads the “Summary” sheet, or the first sheet containing a Site column.</Typography>
            <Button variant="contained" sx={{ mt: 1.5 }} onClick={(event) => { event.stopPropagation(); inputRef.current?.click(); }}>Browse file…</Button>
            <input ref={inputRef} hidden type="file" accept=".xlsx,.xlsm,.csv" onChange={(event) => handleFile(event.target.files[0])} />
          </Card>
          {busy && <LinearProgress sx={{ mt: 1 }} />}
          {status && <Alert severity={status.severity} sx={{ mt: 1.25 }}>{status.message}</Alert>}
          {parsed && <>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mt: 1.25 }}>
              {[['Sites parsed', parsed.sites.length], ['DC Capacity (kW)', parsed.sites.reduce((a, site) => a + (Number(site.dc) || 0), 0)], ['AC Capacity (kW)', parsed.sites.reduce((a, site) => a + (Number(site.ac) || 0), 0)]].map(([label, value]) => <Card key={label} sx={{ p: 1.25 }}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography sx={{ fontSize: 19, fontWeight: 900 }}>{formatNumber(value)}</Typography></Card>)}
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.25 }}>
              <TextField size="small" value={roundName} onChange={(event) => setRoundName(event.target.value)} placeholder="Round name" sx={{ flex: 1 }} />
              <Button variant="contained" color="secondary" startIcon={<FolderRoundedIcon />} onClick={add}>Add to Library</Button>
              <Button variant="contained" color="primary" startIcon={<CheckCircleRoundedIcon />} onClick={() => onLoadNow({ ...parsed, name: roundName || 'Uploaded data' })}>Load now</Button>
            </Stack>
          </>}
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>Parsing runs entirely in your browser—no uploaded file is sent to a server. Columns are matched by header name, so their order does not matter.</Typography>
        </Box>

        <Box>
          <Card sx={{ p: 1.75, mb: 1.5 }}>
            <SectionHeader title="Detected column mapping" />
            {mapping.length ? <Stack spacing={0.45}>{mapping.map(({ header, key }) => <Stack direction="row" justifyContent="space-between" key={`${header}-${key}`} sx={{ px: 0.8, py: 0.55, borderRadius: 1, '&:nth-of-type(even)': { bgcolor: 'action.hover' } }}><Typography variant="caption">{String(header)}</Typography><Chip size="small" color={mapHeader(header) ? 'primary' : 'warning'} label={key} /></Stack>)}</Stack> : <Typography color="text.secondary" variant="body2">Upload a file to see how its columns map to the dashboard fields.</Typography>}
          </Card>
          <Card sx={{ p: 1.75 }}>
            <SectionHeader color="info.main" title="Data preview" subtitle={parsed ? `· first ${Math.min(6, parsed.sites.length)} sites` : ''} />
            {parsed ? <TableContainer sx={{ maxHeight: 300, border: 1, borderColor: 'divider', borderRadius: 1 }}><Table stickyHeader size="small"><TableHead><TableRow><TableCell>Site</TableCell><TableCell align="right">DC</TableCell><TableCell align="right">AC</TableCell><TableCell align="right">Grade</TableCell></TableRow></TableHead><TableBody>{parsed.sites.slice(0, 6).map((site) => <TableRow key={site.site}><TableCell>{site.site}</TableCell><TableCell align="right">{formatNumber(site.dc)}</TableCell><TableCell align="right">{formatNumber(site.ac)}</TableCell><TableCell align="right">{site.grade || '—'}</TableCell></TableRow>)}</TableBody></Table></TableContainer> : <Typography color="text.secondary" variant="body2">No data loaded yet.</Typography>}
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
