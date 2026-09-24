import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Container, CssBaseline, ThemeProvider, Typography } from '@mui/material';
import AppHeader from './components/AppHeader.jsx';
import LoginPage from './components/LoginPage.jsx';
import { SAMPLE_SITES } from './data/sampleSites.js';
import { useAuth } from './hooks/useAuth.js';
import { useRounds } from './hooks/useRounds.js';
import DashboardPage from './pages/DashboardPage.jsx';
import UploadPage from './pages/UploadPage.jsx';
import { publishActiveRound, subscribeToActiveRound } from './services/cloud.js';
import { makeTheme } from './theme.js';

function readTheme() {
  try { return localStorage.getItem('sm_theme') === 'light' ? 'light' : 'dark'; }
  catch { return 'dark'; }
}

export default function App() {
  const { session, login, logout } = useAuth();
  const roundsApi = useRounds(SAMPLE_SITES);
  const {
    rounds, activeRoundId, activeRound, addRound: saveRound, deleteRound,
    selectRound, replaceFromCloud,
  } = roundsApi;
  const [mode, setMode] = useState(readTheme);
  const [view, setView] = useState('dashboard');
  const [transientRound, setTransientRound] = useState(null);
  const [cloudStatus, setCloudStatus] = useState('connecting');
  const theme = useMemo(() => makeTheme(mode), [mode]);

  const toggleMode = () => setMode((current) => {
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('sm_theme', next);
    return next;
  });

  useEffect(() => {
    if (!session) return undefined;
    setCloudStatus('live');
    return subscribeToActiveRound((remote) => {
      setCloudStatus('live');
      if (session.role === 'client') {
        if (Array.isArray(remote.library)) replaceFromCloud(remote.library, remote.id);
        setTransientRound(remote.sites?.length ? { name: remote.name || 'Round', sites: remote.sites, dateRange: remote.dateRange || '' } : null);
      }
    }, () => setCloudStatus('error'));
  }, [replaceFromCloud, session]);

  useEffect(() => {
    if (session?.role === 'admin' && activeRound) {
      publishActiveRound(activeRound, rounds).then(() => setCloudStatus('live')).catch(() => setCloudStatus('error'));
    }
  }, [activeRound, rounds, session?.role]);

  const changeView = (next) => setView(next === 'upload' && session?.role !== 'admin' ? 'dashboard' : next);
  const projectRound = useCallback((id) => {
    setTransientRound(null);
    selectRound(id);
    setView('dashboard');
  }, [selectRound]);
  const addRound = useCallback((data) => {
    setTransientRound(null);
    saveRound(data);
    setView('dashboard');
  }, [saveRound]);
  const loadNow = useCallback((data) => {
    setTransientRound(data);
    selectRound(null);
    setView('dashboard');
  }, [selectRound]);
  const changeRound = useCallback((id) => {
    setTransientRound(null);
    selectRound(id);
  }, [selectRound]);

  const active = transientRound || activeRound;
  const sites = active?.sites || SAMPLE_SITES;
  const roundName = active?.name || 'Built-in sample dataset';
  const dateRange = active?.dateRange || '';

  if (!session) return <ThemeProvider theme={theme}><CssBaseline /><LoginPage onLogin={login} /></ThemeProvider>;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh' }}>
        <AppHeader
          role={session.role} user={session.user} view={view} onViewChange={changeView} onLogout={logout}
          mode={mode} onToggleMode={toggleMode} rounds={rounds}
          activeRoundId={transientRound ? '' : activeRoundId} onRoundChange={changeRound}
          dateRange={dateRange} cloudStatus={cloudStatus}
        />
        <Container maxWidth={false} sx={{ px: { xs: 1.25, sm: 2.25 }, py: 2 }}>
          {view === 'dashboard' ? (
            <DashboardPage key={`${roundName}-${sites.length}`} sites={sites} roundName={roundName} />
          ) : (
            <UploadPage
              rounds={rounds} activeRoundId={activeRoundId}
              onAddRound={addRound} onProject={projectRound} onDelete={deleteRound} onLoadNow={loadNow}
            />
          )}
          <Typography component="footer" variant="caption" color="text.secondary" align="center" sx={{ display: 'block', borderTop: 1, borderColor: 'divider', mt: 2, pt: 1.5 }}>Solar Master — Developed by D.Boxi</Typography>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
