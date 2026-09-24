import * as XLSX from 'xlsx';

const NUMERIC_KEYS = new Set([
  'dc', 'ac', 'invpm', 'ae', 'dsd', 'mppt_cnt', 'spare_mppt', 'inv_bd_impact',
  'data_avail', 'tot_inv', 'rank', 'pot_impact', 'str_impact', 'bd_cnt', 'str_cnt',
  'comms_cnt', 'inv_avail', 'specific_yield', 'total_strings', 'mppt_spikes',
]);

export function mapHeader(value) {
  const text = String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!text) return null;
  if (text.includes('inv/pm') && text.includes('status')) return 'invpm_status';
  if (text.includes('inv/pm')) return 'invpm';
  if (text.includes('impact')) {
    if (text.includes('breakdown') || /\bbd\b/.test(text)) return 'inv_bd_impact';
    if (text.includes('string') || /\bstr\b/.test(text)) return 'str_impact';
    if (text.includes('pot') || text.includes('comm')) return 'pot_impact';
  }
  if (text.includes('inverter breakdown') && text.includes('count')) return 'bd_cnt';
  if (text.includes('inverter breakdown') && (text.includes('text') || text.includes('detail'))) return 'bd_txt';
  if (text.includes('string') && text.includes('count')) return 'str_cnt';
  if (text.includes('string') && (text.includes('text') || text.includes('detail'))) return 'str_txt';
  if (text.includes('mppt') && text.includes('voltage') && text.includes('anomaly')) return 'mppt_txt';
  if (text.includes('mppt') && (text.includes('anamoly') || text.includes('anomaly')) && text.includes('count')) return 'mppt_cnt';
  if (text.includes('spare mppt')) return 'spare_mppt';
  if (text.includes('mppt') && text.includes('spike')) return 'mppt_spikes';
  if (text.includes('comms issue') && text.includes('count')) return 'comms_cnt';
  if (text.includes('comms issue') || (text.includes('communication') && text.includes('issue'))) return 'comms_txt';
  if (text.includes('performance grading') && text.includes('text')) return 'grade_txt';
  if (text.includes('performance grading') || text === 'grade') return 'grade';
  if (text.includes('data avail')) return 'data_avail';
  if (text.includes('inverter avail')) return 'inv_avail';
  if (
    (text.includes('string') && text.includes('total')) ||
    text.includes('number of string connected') ||
    text.includes('string connected as per meta')
  ) {
    return 'total_strings';
  }
  if (text.includes('dsd')) return 'dsd';
  if (text === 'sp.yd' || text.includes('specific yield') || text.includes('sp yd')) return 'specific_yield';
  if (text.includes('actual/exp')) return 'ae';
  if (text.includes('total inverter')) return 'tot_inv';
  if (text === 'rank') return 'rank';
  if (text === 'site' || text === 'site name') return 'site';
  if (text.includes('dc capacity')) return 'dc';
  if (text.includes('ac capacity')) return 'ac';
  return null;
}

export function gridToSites(grid) {
  let headerIndex = -1;
  let columnMap = {};
  for (let rowIndex = 0; rowIndex < Math.min(grid.length, 12); rowIndex += 1) {
    const candidate = {};
    let hasSite = false;
    (grid[rowIndex] || []).forEach((cell, columnIndex) => {
      const key = mapHeader(cell);
      if (key) candidate[columnIndex] = key;
      if (key === 'site') hasSite = true;
    });
    if (hasSite) { headerIndex = rowIndex; columnMap = candidate; break; }
  }
  if (headerIndex < 0) throw new Error('No header row containing a “Site” column was found.');

  const sites = grid.slice(headerIndex + 1).flatMap((row = []) => {
    const site = {};
    Object.entries(columnMap).forEach(([index, key]) => { site[key] = row[index] ?? ''; });
    if (!String(site.site || '').trim()) return [];
    Object.keys(site).forEach((key) => {
      if (NUMERIC_KEYS.has(key)) {
        const number = Number.parseFloat(String(site[key]).replace(/[,%\s]/g, ''));
        site[key] = Number.isNaN(number) ? 0 : number;
      } else site[key] = String(site[key]);
    });
    ['ae', 'dsd', 'data_avail', 'inv_avail', 'inv_bd_impact', 'str_impact', 'pot_impact'].forEach((key) => {
      if (Number(site[key]) > 1.5) site[key] /= 100;
    });
    site.grade = site.grade ? Number.parseInt(site.grade, 10) : null;
    ['dc', 'ac', 'ae', 'dsd', 'data_avail', 'inv_avail', 'tot_inv', 'bd_cnt', 'str_cnt', 'mppt_cnt', 'comms_cnt', 'spare_mppt', 'pot_impact', 'str_impact', 'inv_bd_impact', 'rank', 'invpm'].forEach((key) => { site[key] ??= 0; });
    ['bd_txt', 'str_txt', 'mppt_txt', 'comms_txt', 'invpm_status'].forEach((key) => { site[key] ??= ''; });
    return [site];
  });
  if (!sites.length) throw new Error('The header was found, but there are no rows with a site name.');
  return { sites, columnMap };
}

function excelDate(value) {
  if (!value) return '';
  if (value instanceof Date) return value.toLocaleDateString('en-GB').replaceAll('/', '-').replace(/-(\d{4})$/, (_, y) => `-${y.slice(-2)}`);
  if (typeof value === 'number' && value > 20000 && value < 80000) {
    const date = XLSX.SSF.parse_date_code(value);
    return `${String(date.d).padStart(2, '0')}-${String(date.m).padStart(2, '0')}-${String(date.y).slice(-2)}`;
  }
  return String(value).trim();
}


function enrichFromCurrentAnalysis(workbook, sites) {

  //alert("enrichFromCurrentAnalysis called");

  const name = workbook.SheetNames.find(
    (sheetName) => sheetName.toLowerCase() === 'current analysis'
  );

  if (!name) return '';

  const rows = XLSX.utils.sheet_to_json(
    workbook.Sheets[name],
    {
      header: 1,
      raw: true,
    }
  );

  const date1 = excelDate(rows[0]?.[14]);
  const date2 = excelDate(rows[1]?.[14]);

  const byName = new Map(
    sites.map((site) => [String(site.site).toLowerCase(), site])
  );

  const impactBySite = new Map();
  const stringsBySite = new Map();

  const parseImpact = (value) => {
    let number = Number.parseFloat(
      String(value ?? '').replace(/[,%\s]/g, '')
    ) || 0;

    if (number > 1.5) number /= 100;

    return number;
  };

  rows.slice(1).forEach((row) => {
    //
    // ORIGINAL HTML STRING COUNT LOGIC
    // Site column = 6
    // String count column = 10
    //
    const stringSiteName = String(row[6] ?? '').trim();

    if (stringSiteName) {
      const stringSiteKey = stringSiteName.toLowerCase();

      const totalStrings =
        Number.parseFloat(
          String(row[10] ?? '').replace(/[,%\s]/g, '')
        ) || 0;

      stringsBySite.set(
        stringSiteKey,
        (stringsBySite.get(stringSiteKey) || 0) + totalStrings
      );
    }

    //
    // IMPACT LOGIC
    // Site column = 13
    //
    const siteName = String(row[13] ?? '').trim();

    if (!siteName) return;

    const normalized = siteName.toLowerCase();

    const record =
      impactBySite.get(normalized) || {
        bd: 0,
        comms: 0,
        string: 0,
        inverters: [],
      };

    const bd = parseImpact(row[55]);

    record.bd += bd;
    record.comms += parseImpact(row[56]);
    record.string += parseImpact(row[57]);

    if (bd > 0) {
      record.inverters.push({
        name: String(
          row[14] || `Inverter ${record.inverters.length + 1}`
        ),
        impact: bd,
      });
    }

    impactBySite.set(normalized, record);
  });

  //
  // APPLY IMPACTS
  //
  impactBySite.forEach((record, key) => {
    const site = byName.get(key);

    if (!site) return;

    site.inv_bd_impact = Math.min(1, record.bd);
    site.pot_impact = Math.min(1, record.comms);
    site.str_impact = Math.min(1, record.string);

    site.breakdownInverters = record.inverters;
  });

  //
  // APPLY TOTAL STRING COUNTS
  //
  stringsBySite.forEach((count, key) => {
    const site = byName.get(key);

    if (!site) return;

    site.total_strings = count;
  });

  console.log(
    'Total Strings Loaded:',
    sites.reduce(
      (sum, site) => sum + (+site.total_strings || 0),
      0
    )
  );

  return date1 && date2
    ? `${date1} to ${date2}`
    : date1;
}
// function enrichFromCurrentAnalysis(workbook, sites) {
//   const name = workbook.SheetNames.find((sheetName) => sheetName.toLowerCase() === 'current analysis');
//   if (!name) return '';
//   const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, raw: true });
//   const date1 = excelDate(rows[0]?.[14]);
//   const date2 = excelDate(rows[1]?.[14]);
//   const byName = new Map(sites.map((site) => [site.site.toLowerCase(), site]));
//   const impactBySite = new Map();
//   rows.slice(1).forEach((row) => {
//     const siteName = String(row[13] ?? '').trim();
//     if (!siteName) return;
//     const normalized = siteName.toLowerCase();
//     const record = impactBySite.get(normalized) || { bd: 0, comms: 0, string: 0, inverters: [] };
//     const parseImpact = (value) => {
//       let number = Number.parseFloat(String(value ?? '').replace(/[,%\s]/g, '')) || 0;
//       if (number > 1.5) number /= 100;
//       return number;
//     };
//     const bd = parseImpact(row[55]);
//     record.bd += bd;
//     record.comms += parseImpact(row[56]);
//     record.string += parseImpact(row[57]);
//     if (bd > 0) record.inverters.push({ name: String(row[14] || `Inverter ${record.inverters.length + 1}`), impact: bd });
//     impactBySite.set(normalized, record);
//   });
//   impactBySite.forEach((record, key) => {
//     const site = byName.get(key);
//     if (!site) return;
//     site.inv_bd_impact = Math.min(1, record.bd);
//     site.pot_impact = Math.min(1, record.comms);
//     site.str_impact = Math.min(1, record.string);
//     site.breakdownInverters = record.inverters;
//   });
//   return date1 && date2 ? `${date1} to ${date2}` : date1;
// }

export async function parsePortfolioFile(file) {
  //alert("enrichFromCurrentAnalysis called");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
  const preferred = workbook.SheetNames.find((name) => name.toLowerCase() === 'summary') || workbook.SheetNames[0];
  if (!preferred) throw new Error('The workbook does not contain a readable worksheet.');
  const grid = XLSX.utils.sheet_to_json(workbook.Sheets[preferred], { header: 1, raw: true, defval: '' });
  const parsed = gridToSites(grid);
  return {
    ...parsed,
    sheet: preferred,
    dateRange: enrichFromCurrentAnalysis(workbook, parsed.sites),
    source: file.name,
    preview: grid.slice(0, 8),
  };
}
