import { Box, Typography } from '@mui/material';

export default function SectionHeader({ icon, title, subtitle, color = 'primary.main', action }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25, minWidth: 0 }}>
      <Box sx={{ width: 9, height: 9, flex: '0 0 auto', borderRadius: '50%', bgcolor: color }} />
      {icon && <Box component="span" sx={{ fontSize: 17, lineHeight: 1 }}>{icon}</Box>}
      <Typography component="h2" variant="h3" sx={{ lineHeight: 1.3 }}>{title}</Typography>
      {subtitle && <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3 }}>{subtitle}</Typography>}
      {action && <Box sx={{ ml: 'auto', flex: '0 0 auto' }}>{action}</Box>}
    </Box>
  );
}
