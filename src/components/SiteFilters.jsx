import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { Autocomplete, Box, Button, Chip, InputAdornment, TextField } from '@mui/material';

export default function SiteFilters({ sites, selected, onChange, search, onSearchChange, onReset, inHeader = false }) {
  const names = sites.map((site) => site.site).sort((a, b) => a.localeCompare(b));
  const matching = search.trim()
    ? names.filter((name) => name.toLowerCase().includes(search.trim().toLowerCase()))
    : [];

  return (
    <Box data-no-print="true" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(300px, 1fr) minmax(240px, .7fr) auto' }, gap: 1, mb: inHeader ? 0 : 1.5, width: '100%' }}>
      <Autocomplete
        multiple disableCloseOnSelect options={names} value={selected}
        onChange={(_, value) => onChange(value)}
        limitTags={2}
        renderTags={(value, getTagProps) => value.map((option, index) => <Chip size="small" label={option} {...getTagProps({ index })} key={option} />)}
        renderInput={(params) => <TextField {...params} size="small" label="Filter by Site" placeholder={selected.length ? '' : 'All Sites'} />}
      />
      <TextField
        size="small" value={search} onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search a site name…"
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment>,
          endAdornment: search ? <InputAdornment position="end"><Chip size="small" label={`${matching.length} selected`} /></InputAdornment> : null,
        }}
      />
      <Button variant="outlined" startIcon={<RestartAltRoundedIcon />} onClick={onReset}>Reset</Button>
    </Box>
  );
}
