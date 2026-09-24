import CloudDoneRoundedIcon from '@mui/icons-material/CloudDoneRounded';
import CloudOffRoundedIcon from '@mui/icons-material/CloudOffRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import {
  AppBar, Box, Button, Chip, FormControl, IconButton, MenuItem, Select, Stack, Toolbar, Tooltip, Typography,
} from '@mui/material';

export default function AppHeader({
  role, user, view, onViewChange, onLogout, mode, onToggleMode,
  rounds, activeRoundId, onRoundChange, dateRange, cloudStatus,
}) {
  return (
    <AppBar position="sticky" color="transparent" elevation={0} data-no-print="true" sx={{ backdropFilter: 'blur(14px)', borderBottom: 1, borderColor: 'divider', bgcolor: (theme) => `${theme.palette.background.default}e8` }}>
      <Toolbar sx={{ minHeight: { xs: 72, md: 76 }, py: 1, px: { xs: 1.5, sm: 2.25 }, alignItems: 'center', gap: 1.5, flexWrap: { xs: 'wrap', lg: 'nowrap' } }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: { md: 315 }, mr: { lg: 1 } }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 2, display: 'grid', placeItems: 'center', fontSize: 24, flex: '0 0 auto', background: 'linear-gradient(135deg, #2f81f7, #06b6d4)' }}>☀️</Box>
          <Box>
            <Typography variant="h1" component="h1" lineHeight={1.05}>Solar Master</Typography>
            <Typography variant="caption" color="text.secondary">Portfolio Analytics</Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.75}>
          <Button size="small" variant={view === 'dashboard' ? 'contained' : 'outlined'} startIcon={<DashboardRoundedIcon />} onClick={() => onViewChange('dashboard')}>Dashboard</Button>
          {role === 'admin' && <Button size="small" variant={view === 'upload' ? 'contained' : 'outlined'} startIcon={<UploadFileRoundedIcon />} onClick={() => onViewChange('upload')}>Data Upload</Button>}
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1} sx={{ ml: { lg: 'auto' }, width: { xs: '100%', lg: 'auto' }, overflowX: 'auto', pb: { xs: 0.5, lg: 0 } }}>
          {view === 'dashboard' && <>
            <Box sx={{ minWidth: { xs: 210, md: 235 }, px: 1.5, py: 0.6, borderRadius: 1.5, color: '#fff', border: '1px solid #3b82f6', background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', boxShadow: '0 2px 10px rgba(37,99,235,.35)' }}>
              <Typography sx={{ fontSize: 9.5, color: '#cfe0ff', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 800, lineHeight: 1.2 }}>Round</Typography>
              <FormControl fullWidth size="small" variant="standard">
                <Select
                  disableUnderline displayEmpty value={activeRoundId || ''}
                  onChange={(event) => onRoundChange(event.target.value || null)}
                  renderValue={(value) => rounds.find((round) => round.id === value)?.name || 'Built-in sample dataset'}
                  sx={{ color: '#fff', fontWeight: 900, fontSize: 13, lineHeight: 1.2, '& .MuiSelect-icon': { color: '#fff' }, '& .MuiSelect-select': { py: 0.15, pr: 3 } }}
                >
                  <MenuItem value=""><em>Built-in sample dataset</em></MenuItem>
                  {rounds.map((round) => <MenuItem key={round.id} value={round.id}>{round.name} ({round.sites.length} sites)</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ minWidth: 190, px: 1.75, py: 0.75, borderRadius: 1.5, color: '#eafff5', border: '1px solid #34d399', background: 'linear-gradient(135deg, #059669, #10b981)', boxShadow: '0 2px 10px rgba(16,185,129,.35)' }}>
              <Typography sx={{ fontSize: 9.5, color: '#c9ffe8', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 800, lineHeight: 1.2 }}>Analysis Period</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 900, whiteSpace: 'nowrap' }}>
                {dateRange ? dateRange.replace(/\s+to\s+/i, ' – ') : 'Upload or project a round'}
              </Typography>
            </Box>
          </>}
          {view === 'upload' && <Chip icon={cloudStatus === 'live' ? <CloudDoneRoundedIcon /> : <CloudOffRoundedIcon />} color={cloudStatus === 'live' ? 'success' : 'warning'} variant="outlined" label={`Cloud: ${cloudStatus}`} />}
          <Chip label={`${user} · ${role}`} color={role === 'admin' ? 'success' : 'info'} sx={{ fontWeight: 800 }} />
          <Tooltip title={mode === 'dark' ? 'Switch to day mode' : 'Switch to night mode'}><IconButton onClick={onToggleMode}>{mode === 'dark' ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}</IconButton></Tooltip>
          <Tooltip title="Logout"><IconButton color="error" onClick={onLogout}><LogoutRoundedIcon /></IconButton></Tooltip>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
