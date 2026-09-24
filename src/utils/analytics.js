const finiteValues = (sites, key) => sites.map((site) => Number(site[key])).filter(Number.isFinite);

export const isHealthyInvPm = (site) => {
  const ratio = Number(site.invpm);
  return Number.isFinite(ratio) && ratio >= 0.95 && ratio <= 1.05;
};

export const sum = (sites, key) => sites.reduce((total, site) => total + (Number(site[key]) || 0), 0);

export const average = (sites, key) => {
  const values = finiteValues(sites, key);
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
};

export function effectiveImpact(site, countKey, impactKey) {
  const recorded = Number(site[impactKey]) || 0;
  if (recorded > 0) return recorded;
  const total = Number(site.tot_inv) || 0;
  const affected = Number(site[countKey]) || 0;
  return total > 0 && affected > 0 ? Math.min(1, affected / total) : 0;
}

export function weightedImpact(sites, countKey, impactKey) {
  const totals = sites.reduce((acc, site) => {
    const dc = Number(site.dc) || 0;
    acc.capacity += dc;
    acc.impact += effectiveImpact(site, countKey, impactKey) * dc;
    return acc;
  }, { capacity: 0, impact: 0 });
  return totals.capacity ? totals.impact / totals.capacity : 0;
}

export function summarizePortfolio(sites) {
  const bdImpact = weightedImpact(sites, 'bd_cnt', 'inv_bd_impact');
  const stringImpact = weightedImpact(sites, 'str_cnt', 'str_impact');
  const commsImpact = weightedImpact(sites, 'comms_cnt', 'pot_impact');
  const totalStrings = sum(sites, 'total_strings');
  const stringsDown = sum(sites, 'str_cnt');
  const stringAvailability = totalStrings > 0
    ? Math.max(0, 1 - stringsDown / totalStrings)
    : Math.max(0, 1 - stringImpact);
  const dataAvailability = average(sites, 'data_avail');
  const inverterAvailability = average(sites, 'inv_avail');
  const dsd = average(sites, 'dsd');
  const specificYieldValues = finiteValues(sites, 'specific_yield').filter((value) => value > 0);
  const specificYield = specificYieldValues.length
    ? specificYieldValues.reduce((a, b) => a + b, 0) / specificYieldValues.length : 0;
  const good = sites.filter(isHealthyInvPm).length;
  const invPmValues = finiteValues(sites, 'invpm').filter((value) => value > 0);

  return {
    siteCount: sites.length,
    dc: sum(sites, 'dc'), ac: sum(sites, 'ac'), inverters: sum(sites, 'tot_inv'),
    strings: totalStrings,
    dsd, dataAvailability, inverterAvailability, stringAvailability,
    adirainAvailability: dataAvailability * inverterAvailability * stringAvailability,
    specificYield,
    bdImpact, stringImpact, commsImpact,
    totalImpact: Math.min(1, bdImpact + stringImpact + commsImpact),
    bdCount: sum(sites, 'bd_cnt'), stringCount: stringsDown, commsCount: sum(sites, 'comms_cnt'),
    mpptCount: sum(sites, 'mppt_cnt'), mpptSpikes: sum(sites, 'mppt_spikes'),
    averageActualExpected: average(sites, 'ae'), averageInvPm: invPmValues.length ? invPmValues.reduce((a, b) => a + b, 0) / invPmValues.length : 0,
    goodInvPm: good, badInvPm: sites.length - good,
    healthyPercent: sites.length ? Math.round(good / sites.length * 100) : 0,
  };
}

export function gradeCounts(sites) {
  return sites.reduce((counts, site) => {
    if (counts[site.grade] != null) counts[site.grade] += 1;
    return counts;
  }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
}

export const topByCount = (sites, key, limit = 5) => [...sites]
  .filter((site) => Number(site[key]) > 0)
  .sort((a, b) => Number(b[key]) - Number(a[key]))
  .slice(0, limit);

export const topByImpact = (sites, countKey, impactKey, limit = 5) => [...sites]
  .map((site) => ({ site, value: effectiveImpact(site, countKey, impactKey) }))
  .filter(({ value }) => value > 0)
  .sort((a, b) => b.value - a.value)
  .slice(0, limit);

export function topAndBottomPerformance(sites) {
  const sorted = [...sites].filter((site) => Number.isFinite(Number(site.ae)))
    .sort((a, b) => Number(b.ae) - Number(a.ae));
  return { top: sorted.slice(0, 10), bottom: sorted.slice(-10) };
}

export function topImpactedSites(sites, limit = 10) {
  return [...sites].map((site) => ({
    site,
    bd: effectiveImpact(site, 'bd_cnt', 'inv_bd_impact'),
    string: effectiveImpact(site, 'str_cnt', 'str_impact'),
    comms: effectiveImpact(site, 'comms_cnt', 'pot_impact'),
  })).map((item) => ({ ...item, total: item.bd + item.string + item.comms }))
    .filter(({ total }) => total > 0).sort((a, b) => b.total - a.total).slice(0, limit);
}
