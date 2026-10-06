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


function roundStartTimestamp(round) {
  const value = String(round?.dateRange || '').trim();
  const match = value.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})/);
  if (!match) return null;
  const year = Number(match[3]) < 100 ? Number(match[3]) + 2000 : Number(match[3]);
  const timestamp = Date.UTC(year, Number(match[2]) - 1, Number(match[1]));
  return Number.isFinite(timestamp) ? timestamp : null;
}

function roundNumber(round) {
  const value = String(round?.name || '');
  const match = value.match(/(\d+)\s*(?:st|nd|rd|th)?[\s_\-]*round/i) || value.match(/round[\s_\-#]*(\d+)/i);
  return match ? Number(match[1]) : null;
}

function compareRounds(a, b) {
  const aTime = roundStartTimestamp(a);
  const bTime = roundStartTimestamp(b);
  if (aTime != null && bTime != null && aTime !== bTime) return aTime - bTime;
  const aNumber = roundNumber(a);
  const bNumber = roundNumber(b);
  if (aNumber != null && bNumber != null && aNumber !== bNumber) return aNumber - bNumber;
  return (a?.addedAt || 0) - (b?.addedAt || 0);
}

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
  const [selectedSites, setSelectedSites] = useState([]);
  const [siteSearch, setSiteSearch] = useState('');
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

  useEffect(() => {
    setSelectedSites([]);
    setSiteSearch('');
  }, [activeRoundId, transientRound, sites]);

  const handleSiteSearch = useCallback((value) => {
    setSiteSearch(value);
    const query = value.trim().toLowerCase();
    setSelectedSites(query ? sites.filter((site) => String(site.site || '').toLowerCase().includes(query)).map((site) => site.site) : []);
  }, [sites]);

  const resetSiteFilters = useCallback(() => {
    setSelectedSites([]);
    setSiteSearch('');
  }, []);
  const previousSites = useMemo(() => {
    if (transientRound || !activeRoundId || rounds.length < 2) return null;
    const ordered = [...rounds].sort(compareRounds);
    const index = ordered.findIndex((round) => round.id === activeRoundId);
    return index > 0 ? (ordered[index - 1].sites || null) : null;
  }, [activeRoundId, rounds, transientRound]);

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
          sites={sites} selectedSites={selectedSites} onSelectedSitesChange={setSelectedSites}
          siteSearch={siteSearch} onSiteSearchChange={handleSiteSearch} onResetSiteFilters={resetSiteFilters}
        />
        <Container maxWidth={false} sx={{ px: { xs: 1.25, sm: 2.25 }, py: 2 }}>
          {view === 'dashboard' ? (
            <DashboardPage
              key={`${roundName}-${sites.length}`}
              sites={sites}
              previousSites={previousSites}
              roundName={roundName}
              selected={selectedSites}
              onSelectedChange={setSelectedSites}
            />
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
