import { useEffect, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import { COLORS, SITE_COLUMNS } from '../constants.js';
import { effectiveImpact, summarizePortfolio } from '../utils/analytics.js';
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
  bd: { title: 'Inverter Breakdowns', key: 'bd_cnt', textKey: 'bd_txt', color: COLORS.warn, impact: ['bd_cnt', 'inv_bd_impact'] },
  string: { title: 'String Failures', key: 'str_cnt', textKey: 'str_txt', color: COLORS.pink, impact: ['str_cnt', 'str_impact'] },
  comms: { title: 'Communication Issues', key: 'comms_cnt', textKey: 'comms_txt', color: COLORS.cyan, impact: ['comms_cnt', 'pot_impact'] },
  mppt: { title: 'Potential RSD Failures', key: 'mppt_cnt', textKey: 'mppt_txt', color: COLORS.purple },
  mpptSpikes: { title: 'MPPT Spikes', key: 'mppt_spikes', color: COLORS.purple },
};

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
  useEffect(() => { setSelected([]); setSearch(''); setDetail(null); }, [sites]);

  const visibleSites = useMemo(() => selected.length ? sites.filter((site) => selected.includes(site.site)) : sites, [selected, sites]);
  const summary = useMemo(() => summarizePortfolio(visibleSites), [visibleSites]);

  const openSite = (site) => setDetail({ kind: 'site', title: site.site, subtitle: 'Complete site performance and issue details.', sites: [site] });
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

  const openGrade = (grade) => openList(`Grade ${grade} Sites`, visibleSites.filter((site) => site.grade === grade), (site) => formatPercent(site.ae), 'Sites grouped by Actual / Expected performance grade.', { color: COLORS.accent });
  const openStatus = (status) => openList(`INV/PM — ${status}`, visibleSites.filter((site) => site.invpm_status === status), (site) => site.invpm ? Number(site.invpm).toFixed(2) : '—', `Sites with ${status.toLowerCase()} inverter-to-production-meter health.`, { color: status === 'Good' ? COLORS.good : COLORS.bad });
  const openHealth = (kind) => {
    const config = {
      dsd: ['DSD Availability', (site) => site.dsd], data: ['Data Availability', (site) => site.data_avail],
      inverter: ['Inverter Availability', (site) => site.inv_avail],
      string: ['String Availability', (site) => site.total_strings ? Math.max(0, 1 - site.str_cnt / site.total_strings) : Math.max(0, 1 - effectiveImpact(site, 'str_cnt', 'str_impact'))],
      adirain: ['Adirain Availability', (site) => (site.data_avail || 0) * (site.inv_avail || 0) * (site.total_strings ? Math.max(0, 1 - site.str_cnt / site.total_strings) : Math.max(0, 1 - effectiveImpact(site, 'str_cnt', 'str_impact')))],
    }[kind];
    const list = [...visibleSites].sort((a, b) => config[1](a) - config[1](b));
    // openList(config[0], list, (site) => formatPercent(config[1](site)), 'Lowest availability is shown first.');
    openList(
      config[0],
      list,
      (site) => formatPercent(config[1](site)),
      'Lowest availability is shown first.',
      {
        compactView: true,
      }
    );
  };
  const openImpact = (kind) => {
    const config = anomalyConfig[kind];
    const list = visibleSites.filter((site) => Number(site[config.key]) > 0).sort((a, b) => Number(b[config.key]) - Number(a[config.key]));
    const valueFor = config.impact ? (site) => `${formatNumber(site[config.key])} · ${formatPercent(effectiveImpact(site, ...config.impact))}` : (site) => formatNumber(site[config.key]);
    openList(config.title, list, valueFor, `${list.reduce((total, site) => total + (Number(site[config.key]) || 0), 0)} issue${list.length === 1 ? '' : 's'} across ${list.length} site${list.length === 1 ? '' : 's'}.`, { textKey: config.textKey, color: config.color });
  };

  const handleSearch = (value) => {
    setSearch(value);
    const query = value.trim().toLowerCase();
    setSelected(query ? sites.filter((site) => site.site.toLowerCase().includes(query)).map((site) => site.site) : []);
  };
  const reset = () => { setSelected([]); setSearch(''); };

  const exportSites = () => exportWorkbook(`Site-Level Detail · ${roundName}`, SITE_COLUMNS.map(([, label]) => label), tableRows(visibleSites), `SiteLevelDetail_${roundName}`);
  const exportImpact = () => exportWorkbook(`Production Impact · ${roundName}`, ['Site', 'Breakdown %', 'String %', 'Comms %', 'MPPT spikes', 'RSD count'], visibleSites.map((site) => [site.site, formatPercent(effectiveImpact(site, 'bd_cnt', 'inv_bd_impact')), formatPercent(effectiveImpact(site, 'str_cnt', 'str_impact')), formatPercent(effectiveImpact(site, 'comms_cnt', 'pot_impact')), site.mppt_spikes || 0, site.mppt_cnt || 0]), `ProductionImpact_${roundName}`);
  const exportLeaders = () => exportWorkbook(`Top Impacted Sites · ${roundName}`, ['Site', 'String Impact', 'Breakdown Impact', 'Comms Impact', 'RSD count'], visibleSites.map((site) => [site.site, formatPercent(effectiveImpact(site, 'str_cnt', 'str_impact')), formatPercent(effectiveImpact(site, 'bd_cnt', 'inv_bd_impact')), formatPercent(effectiveImpact(site, 'comms_cnt', 'pot_impact')), site.mppt_cnt || 0]), `TopImpacted_${roundName}`);

  return (
    <>
      <SiteFilters sites={sites} selected={selected} onChange={setSelected} search={search} onSearchChange={handleSearch} onReset={reset} />
      <StatStrip summary={summary} onOpen={openStat} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1.2fr 1fr' }, gap: 1.5, mb: 1.5 }}>
        <PerformanceMatrix sites={visibleSites} summary={summary} onGradeClick={openGrade} />
        <HealthCard summary={summary} onMetricClick={openHealth} />
        <InvPmHealth sites={visibleSites} summary={summary} onStatusClick={openStatus} />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' }, gap: 1.5, mb: 1.5 }}>
        <ProductionImpact summary={summary} onMetricClick={openImpact} onExcel={exportImpact} onPdf={(element) => exportElementPdf(element, `ProductionImpact_${roundName}`, `Production Impact · ${roundName}`)} />
        <ImpactLeaders sites={visibleSites} onSiteClick={openSite} onExcel={exportLeaders} onPdf={(element) => exportElementPdf(element, `TopImpacted_${roundName}`, `Top Impacted Sites · ${roundName}`)} />
      </Box>
      <PortfolioCharts sites={visibleSites} onSiteClick={openSite} />
      <EquipmentFailureTable sites={visibleSites} roundName={roundName} onSiteClick={openSite} />
      <SiteTable sites={visibleSites} totalCount={sites.length} onExcel={exportSites} onPdf={(element) => exportElementPdf(element, `SiteLevelDetail_${roundName}`, `Site-Level Detail · ${roundName}`)} onSiteClick={openSite} />
      <DetailsDialog detail={detail} onClose={() => setDetail(null)} onFilter={setSiteFilter} />
    </>
  );
}
