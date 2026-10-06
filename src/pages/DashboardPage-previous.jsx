import { useEffect, useMemo, useState } from 'react';
import NavigationRoundedIcon from '@mui/icons-material/NavigationRounded';
import { Box, Fab, Menu, MenuItem } from '@mui/material';
import { COLORS, GRADE_COLOR, SITE_COLUMNS } from '../constants.js';
import { effectiveImpact, isHealthyInvPm, summarizePortfolio } from '../utils/analytics.js';
import { cleanText, formatNumber, formatPercent } from '../utils/format.js';
import { exportElementPdf, exportWorkbook } from '../utils/export.js';
import SiteFilters from '../components/SiteFilters.jsx';
import DetailsDialog from '../components/dashboard/DetailsDialog.jsx';
import EquipmentFailureTable from '../components/dashboard/EquipmentFailureTable.jsx';
import HealthCard from '../components/dashboard/HealthCard.jsx';
import ImpactLeaders from '../components/dashboard/ImpactLeaders.jsx';
import InvPmHealth from '../components/dashboard/InvPmHealth.jsx';
import PerformanceMatrix from '../components/dashboard/PerformanceMatrix.jsx';
import PortfolioCharts from '../components/dashboard/PortfolioCharts.jsx';
import ProductionImpact from '../components/dashboard/ProductionImpact.jsx';
import SiteTable from '../components/dashboard/SiteTable.jsx';
import StatStrip from '../components/dashboard/StatStrip.jsx';

const anomalyConfig = {
  bd: { title: 'Inverter Breakdown', key: 'bd_cnt', textKey: 'bd_txt', color: COLORS.warn, impact: ['bd_cnt', 'inv_bd_impact'] },
  string: { title: 'String Breakdown', key: 'str_cnt', textKey: 'str_txt', color: COLORS.pink, impact: ['str_cnt', 'str_impact'] },
  comms: { title: 'Comms / Potential', key: 'comms_cnt', textKey: 'comms_txt', color: COLORS.cyan, impact: ['comms_cnt', 'pot_impact'] },
  mppt: { title: 'Potential RSD Failures', key: 'mppt_cnt', textKey: 'mppt_txt', color: COLORS.good },
  mpptSpikes: { title: 'MPPT Spikes', key: 'mppt_spikes', color: COLORS.purple },
};

const dashboardSections = [
  ['portfolio-overview', 'Portfolio Overview'],
  ['performance-matrix', 'Performance Matrix'],
  ['system-health', 'System Health & Uptime'],
  ['inv-pm-health', 'INV/PM Health'],
  ['production-impact', 'Production Impact'],
  ['impact-leaders', 'Top 5 Impacted Sites by Category'],
  ['site-performance-ranking', 'Site Performance Ranking'],
  ['top-impacted-sites', 'Top 10 Impacted Sites'],
  ['equipment-failures', 'Sites by Equipment Failure'],
  ['site-level-detail', 'Site-Level Detail'],
];

const sectionStyle = { minWidth: 0, scrollMarginTop: { xs: '140px', lg: '90px' } };

function tableRows(sites) {
  return sites.map((site) => SITE_COLUMNS.map(([key, , type]) => {
    if (type === 'percent') return formatPercent(site[key]);
    if (type === 'number') return site[key] ?? '';
    if (type === 'text') return cleanText(site[key]);
    return site[key] ?? '';
  }));
}

export default function DashboardPage({ sites, roundName = 'Solar Master' }) {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [sectionsAnchor, setSectionsAnchor] = useState(null);
  useEffect(() => { setSelected([]); setSearch(''); setDetail(null); }, [sites]);

  const jumpToSection = (id) => {
    setSectionsAnchor(null);
    const section = document.getElementById(id);
    if (section) {
      section.focus({ preventScroll: true });
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const visibleSites = useMemo(() => selected.length ? sites.filter((site) => selected.includes(site.site)) : sites, [selected, sites]);
  const summary = useMemo(() => summarizePortfolio(visibleSites), [visibleSites]);

  const openSite = (site) => setDetail({ kind: 'site', title: site.site, subtitle: 'Complete site performance and issue details.', sites: [site] });
  const openImpactedSite = (site) => setDetail({ kind: 'impactedSite', title: site.site, subtitle: 'Impact breakdown and equipment issues for this site.', sites: [site] });
  const setSiteFilter = (list) => { setSelected(list.map((site) => site.site)); setDetail(null); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const openList = (title, list, valueFor, subtitle, extra = {}) => setDetail({ title, subtitle: subtitle || `${list.length} site${list.length === 1 ? '' : 's'} in the current selection.`, sites: list, valueFor, ...extra });

  const openStat = (kind) => {
    const config = {
      sites: ['All Sites', () => visibleSites, () => '', 'Portfolio sites in the current selection.'],
      dc: ['Sites by DC Capacity', () => [...visibleSites].sort((a, b) => b.dc - a.dc), (site) => `${formatNumber(site.dc)} kW`],
      ac: ['Sites by AC Capacity', () => [...visibleSites].sort((a, b) => b.ac - a.ac), (site) => `${formatNumber(site.ac)} kW`],
      inverters: ['Inverters by Site', () => [...visibleSites].sort((a, b) => b.tot_inv - a.tot_inv), (site) => formatNumber(site.tot_inv)],
      strings: ['String Count by Site', () => [...visibleSites].sort((a, b) => (b.total_strings || b.str_cnt) - (a.total_strings || a.str_cnt)), (site) => formatNumber(site.total_strings || site.str_cnt)],
    }[kind];
    openList(config[0], config[1](), config[2], config[3]);
  };

  const openGrade = (grade) => openList(`Grade ${grade} — ${({ 5: 'Excellent', 4: 'Good', 3: 'Fair', 2: 'Poor', 1: 'Critical' })[grade]} Sites`, visibleSites.filter((site) => site.grade === grade), (site) => formatPercent(site.ae), 'Sites grouped by Actual / Expected performance grade.', { color: GRADE_COLOR[grade], kind: 'grade' });
  const openStatus = (status) => openList(`INV/PM — ${status}`, visibleSites.filter((site) => isHealthyInvPm(site) === (status === 'Good')), (site) => site.invpm ? Number(site.invpm).toFixed(2) : '—', `Sites with ${status.toLowerCase()} inverter-to-production-meter health.`, { color: status === 'Good' ? COLORS.good : COLORS.bad });
  const openHealth = (kind) => {
    const config = {
      dsd: ['DSD Availability', (site) => site.dsd], data: ['Data Availability', (site) => site.data_avail],
      inverter: ['Inverter Availability', (site) => site.inv_avail],
      string: ['String Availability', (site) => site.total_strings ? Math.max(0, 1 - site.str_cnt / site.total_strings) : Math.max(0, 1 - effectiveImpact(site, 'str_cnt', 'str_impact'))],
      adirain: ['Adirain Availability', (site) => (site.data_avail || 0) * (site.inv_avail || 0) * (site.total_strings ? Math.max(0, 1 - site.str_cnt / site.total_strings) : Math.max(0, 1 - effectiveImpact(site, 'str_cnt', 'str_impact')))],
    }[kind];
    const list = [...visibleSites].sort((a, b) => config[1](a) - config[1](b));
    openList(
      config[0],
      list,
      (site) => formatPercent(config[1](site)),
      kind === 'string' ? 'Per-site string availability = (configured − down) ÷ configured strings, with an inverter-wise breakdown.' : 'Lowest availability is shown first.',
      {
        compactView: kind !== 'string',
        kind: kind === 'string' ? 'stringAvailability' : 'health',
      }
    );
  };
  const openImpact = (kind) => {
    const config = anomalyConfig[kind];
    const list = visibleSites.filter((site) => Number(site[config.key]) > 0).sort((a, b) => Number(b[config.key]) - Number(a[config.key]));
    const count = list.reduce((total, site) => total + (Number(site[config.key]) || 0), 0);
    openList(config.title, list, null, `${formatNumber(count)} issue${count === 1 ? '' : 's'} across ${list.length} site${list.length === 1 ? '' : 's'}.`, { kind: 'impact', impactKey: kind, color: config.color });
  };

  const handleSearch = (value) => {
    setSearch(value);
    const query = value.trim().toLowerCase();
    setSelected(query ? sites.filter((site) => site.site.toLowerCase().includes(query)).map((site) => site.site) : []);
  };
  const reset = () => { setSelected([]); setSearch(''); };

  const exportSites = () => exportWorkbook(`Site-Level Detail · ${roundName}`, SITE_COLUMNS.map(([, label]) => label), tableRows(visibleSites), `SiteLevelDetail_${roundName}`);
  const exportPerformance = () => exportWorkbook(`Performance Matrix · ${roundName}`, ['Grade', 'Label', 'Site', 'Actual/Expected %', 'Specific Yield (kWh/kWp)', 'DC (kW)'], visibleSites.map((site) => [site.grade ?? '', ({ 5: 'Excellent', 4: 'Good', 3: 'Fair', 2: 'Poor', 1: 'Critical' })[site.grade] || '—', site.site, formatPercent(site.ae), site.specific_yield || '', site.dc || 0]), `PerformanceMatrix_${roundName}`);
  const exportImpact = () => exportWorkbook(`Production Impact · ${roundName}`, ['Site', 'Breakdown %', 'String %', 'Comms %', 'MPPT spikes', 'RSD count'], visibleSites.map((site) => [site.site, formatPercent(effectiveImpact(site, 'bd_cnt', 'inv_bd_impact')), formatPercent(effectiveImpact(site, 'str_cnt', 'str_impact')), formatPercent(effectiveImpact(site, 'comms_cnt', 'pot_impact')), site.mppt_spikes || 0, site.mppt_cnt || 0]), `ProductionImpact_${roundName}`);
  const exportLeaders = () => exportWorkbook(`Top Impacted Sites · ${roundName}`, ['Site', 'String Impact', 'Breakdown Impact', 'Comms Impact', 'RSD count'], visibleSites.map((site) => [site.site, formatPercent(effectiveImpact(site, 'str_cnt', 'str_impact')), formatPercent(effectiveImpact(site, 'bd_cnt', 'inv_bd_impact')), formatPercent(effectiveImpact(site, 'comms_cnt', 'pot_impact')), site.mppt_cnt || 0]), `TopImpacted_${roundName}`);

  return (
    <>
      <SiteFilters sites={sites} selected={selected} onChange={setSelected} search={search} onSearchChange={handleSearch} onReset={reset} />
      <Box id="portfolio-overview" tabIndex={-1} sx={sectionStyle}><StatStrip summary={summary} onOpen={openStat} /></Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1.2fr 1fr' }, gap: 1.5, mb: 1.5 }}>
        <Box id="performance-matrix" tabIndex={-1} sx={sectionStyle}><PerformanceMatrix sites={visibleSites} summary={summary} onGradeClick={openGrade} onExcel={exportPerformance} onPdf={(element) => exportElementPdf(element, `PerformanceMatrix_${roundName}`, `Performance Matrix · ${roundName}`)} /></Box>
        <Box id="system-health" tabIndex={-1} sx={sectionStyle}><HealthCard summary={summary} onMetricClick={openHealth} /></Box>
        <Box id="inv-pm-health" tabIndex={-1} sx={sectionStyle}><InvPmHealth sites={visibleSites} summary={summary} onStatusClick={openStatus} /></Box>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' }, gap: 1.5, mb: 1.5 }}>
        <Box id="production-impact" tabIndex={-1} sx={sectionStyle}><ProductionImpact summary={summary} onMetricClick={openImpact} onExcel={exportImpact} onPdf={(element) => exportElementPdf(element, `ProductionImpact_${roundName}`, `Production Impact · ${roundName}`)} /></Box>
        <Box id="impact-leaders" tabIndex={-1} sx={sectionStyle}><ImpactLeaders sites={visibleSites} onSiteClick={openSite} onExcel={exportLeaders} onPdf={(element) => exportElementPdf(element, `TopImpacted_${roundName}`, `Top Impacted Sites · ${roundName}`)} /></Box>
      </Box>
      <PortfolioCharts sites={visibleSites} onSiteClick={openSite} onImpactedSiteClick={openImpactedSite} />
      <Box id="equipment-failures" tabIndex={-1} sx={sectionStyle}><EquipmentFailureTable sites={visibleSites} roundName={roundName} onSiteClick={openSite} /></Box>
      <Box id="site-level-detail" tabIndex={-1} sx={sectionStyle}><SiteTable sites={visibleSites} totalCount={sites.length} onExcel={exportSites} onPdf={(element) => exportElementPdf(element, `SiteLevelDetail_${roundName}`, `Site-Level Detail · ${roundName}`)} onSiteClick={openSite} /></Box>
      <Fab variant="extended" size="small" color="primary" aria-label="Jump to dashboard section" aria-controls={sectionsAnchor ? 'dashboard-sections-menu' : undefined} aria-haspopup="menu" aria-expanded={Boolean(sectionsAnchor)} onClick={(event) => setSectionsAnchor(event.currentTarget)} sx={{ position: 'fixed', right: { xs: 16, sm: 24 }, bottom: { xs: 16, sm: 24 }, zIndex: (theme) => theme.zIndex.appBar - 1, px: 2, boxShadow: 5 }} data-no-print="true">
        <NavigationRoundedIcon sx={{ mr: 0.75 }} /> Sections
      </Fab>
      <Menu id="dashboard-sections-menu" anchorEl={sectionsAnchor} open={Boolean(sectionsAnchor)} onClose={() => setSectionsAnchor(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }} transformOrigin={{ vertical: 'bottom', horizontal: 'right' }} slotProps={{ paper: { sx: { maxHeight: '70vh', minWidth: 250 } } }}>
        {dashboardSections.map(([id, label]) => <MenuItem key={id} onClick={() => jumpToSection(id)}>{label}</MenuItem>)}
      </Menu>
      <DetailsDialog detail={detail} onClose={() => setDetail(null)} onFilter={setSiteFilter} />
    </>
  );
}
