import { useState } from 'react';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
import { Alert, Box, Button, Card, CardContent, Container, TextField, Typography } from '@mui/material';

export default function LoginPage({ onLogin }) {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    const valid = await onLogin(user, password);
    setBusy(false);
    setError(!valid);
    if (!valid) setPassword('');
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2.5, background: 'radial-gradient(1200px 600px at 50% -10%, rgba(47,129,247,.15), transparent)' }}>
      <Container maxWidth="xs" disableGutters>
        <Card sx={{ borderRadius: 4, boxShadow: '0 30px 70px rgba(0,0,0,.6)' }}>
          <CardContent component="form" onSubmit={submit} sx={{ p: { xs: 3, sm: 3.75 }, '&:last-child': { pb: { xs: 3, sm: 3.75 } } }}>
            <Box sx={{ width: 56, height: 56, borderRadius: 2.5, mx: 'auto', mb: 1.75, display: 'grid', placeItems: 'center', fontSize: 30, background: 'linear-gradient(135deg, #2f81f7, #06b6d4)' }}>☀️</Box>
            <Typography variant="h2" align="center">Solar Master</Typography>
            <Typography color="text.secondary" align="center" variant="body2" sx={{ mt: 0.5, mb: 2.5 }}>Sign in to access the dashboard</Typography>
            {error && <Alert severity="error" sx={{ mb: 1.75 }}>Invalid ID or password. Please try again.</Alert>}
            <TextField fullWidth label="User ID" placeholder="admin or client" autoComplete="username" value={user} onChange={(event) => setUser(event.target.value)} sx={{ mb: 1.5 }} autoFocus />
            <TextField fullWidth type="password" label="Password" placeholder="Enter your password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} sx={{ mb: 1.5 }} />
            <Button fullWidth size="large" variant="contained" type="submit" disabled={busy} startIcon={<LockOpenRoundedIcon />}>{busy ? 'Signing in…' : 'Sign In'}</Button>
            <Typography color="text.secondary" align="center" variant="caption" display="block" sx={{ mt: 2 }}>Authorized access only.</Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
