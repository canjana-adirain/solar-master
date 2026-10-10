import { DISPATCH_COST } from '../constants.js';

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

// Colour = urgency: red = dispatch now, amber = schedule, green = low priority
export const PAYBACK_BANDS = [
  { key: 'now', label: 'Dispatch now (≤ 30 days)', max: 30, color: '#ef4444' },
  { key: 'plan', label: 'Schedule (31–180 days)', max: 180, color: '#f59e0b' },
  { key: 'low', label: 'Low priority (> 180 days)', max: Infinity, color: '#22c55e' },
];

export const paybackBand = (days) => PAYBACK_BANDS.find((band) => days <= band.max) || PAYBACK_BANDS[2];

/**
 * Site-wise dispatch ROI from Summary AN–AS.
 * Financial loss (analysis period) = (String + Inverter breakdown kWh loss) × PPA.
 * The sheet's payback = repair cost ÷ (financial loss ÷ analysis days); the analysis
 * period is recovered from the sheet, then payback is re-computed with the FIXED
 * DISPATCH_COST so every site uses the same dispatch cost.
 */
export function buildRoiRows(sites, dispatchCost = DISPATCH_COST) {
  const base = sites.map((site) => {
    const ppa = num(site.ppa);
    const strLoss = num(site.str_loss_kwh);
    const invLoss = num(site.inv_loss_kwh);
    const sheetLoss = num(site.financial_loss);
    const financialLoss = sheetLoss > 0 ? sheetLoss : (strLoss + invLoss) * ppa;
    const sheetRepair = num(site.repair_cost);
    const sheetPayback = Number(site.payback_days);
    const periodDays = sheetRepair > 0 && financialLoss > 0 && Number.isFinite(sheetPayback) && sheetPayback > 0
      ? sheetPayback * financialLoss / sheetRepair
      : null;
    return { site, ppa, strLoss, invLoss, energyLoss: strLoss + invLoss, financialLoss, periodDays };
  });

  const periods = base.map((row) => row.periodDays).filter((value) => value > 0).sort((a, b) => a - b);
  const fallbackDays = periods.length ? periods[Math.floor(periods.length / 2)] : 15;

  return base.map((row) => {
    const days = row.periodDays || fallbackDays;
    const dailyLoss = row.financialLoss > 0 ? row.financialLoss / days : 0;
    const payback = dailyLoss > 0 ? dispatchCost / dailyLoss : null;
    return { ...row, dispatchCost, analysisDays: days, dailyLoss, payback, band: payback == null ? null : paybackBand(payback) };
  }).sort((a, b) => {
    if (a.payback == null && b.payback == null) return String(a.site.site).localeCompare(String(b.site.site));
    if (a.payback == null) return 1;
    if (b.payback == null) return -1;
    return a.payback - b.payback;
  });
}

export const hasRoiData = (sites) => sites.some((site) => 'ppa' in site || 'financial_loss' in site || 'str_loss_kwh' in site);

export function summarizeRoi(rows) {
  const withLoss = rows.filter((row) => row.payback != null);
  return {
    sites: rows.length,
    sitesWithLoss: withLoss.length,
    totalLoss: withLoss.reduce((total, row) => total + row.financialLoss, 0),
    totalEnergy: withLoss.reduce((total, row) => total + row.energyLoss, 0),
    dispatchNow: withLoss.filter((row) => row.band?.key === 'now').length,
    fastest: withLoss[0] || null,
  };
}
