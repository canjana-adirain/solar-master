export const COLORS = {
  accent: '#2f81f7', good: '#22c55e', bad: '#ef4444', warn: '#f59e0b',
  purple: '#a855f7', cyan: '#06b6d4', pink: '#ec4899', lime: '#a3e635', orange: '#fb923c',
};

export const GRADE_COLOR = { 5: COLORS.good, 4: COLORS.lime, 3: COLORS.warn, 2: COLORS.orange, 1: COLORS.bad };

export const USERS = {
  admin: { hash: '9de16b0e6b275515ad537ba6597a4f453c015ddd351ffefd794c0ebf8da2b262', role: 'admin' },
  client: { hash: '712eb3fc4715eb5c5fdc162ef1ecfa47f344a9c555801fbe62bf7f21669ffd16', role: 'client' },
};

export const AUTH_KEY = 'solarmaster_auth_v2';
// Keep the original HTML storage keys so existing saved rounds are available
// immediately after switching to the React application.
export const ROUNDS_KEY = 'solarmaster_rounds_v1';
export const ACTIVE_ROUND_KEY = 'solarmaster_active_round_v1';
export const REACT_V2_ROUNDS_KEY = 'solarmaster_rounds_v2';
export const REACT_V2_ACTIVE_ROUND_KEY = 'solarmaster_active_round_v2';

export const NOISE_TEXT = new Set([
  'No Breakdown', 'No Anomaly', 'No MPPT Voltage Anomaly', 'No Comm. Issue',
  'Register Not Found', null, '',
]);

export const SITE_COLUMNS = [
  ['rank', 'Rank', 'number'], ['site', 'Site'], ['dc', 'DC (kW)', 'number'], ['ac', 'AC (kW)', 'number'],
  ['ae', 'Actual/Exp', 'percent'], ['dsd', 'DSD Avail', 'percent'], ['grade', 'Grade', 'grade'],
  ['invpm_status', 'INV/PM', 'status'], ['tot_inv', 'Inv', 'number'], ['bd_cnt', 'BD', 'number'],
  ['str_cnt', 'Str', 'number'], ['mppt_cnt', 'MPPT', 'number'], ['comms_cnt', 'Comms', 'number'],
  ['bd_txt', 'Inverter Breakdown', 'text'], ['str_txt', 'String Anomaly', 'text'],
  ['mppt_txt', 'MPPT Voltage Anomaly', 'text'], ['comms_txt', 'Communication Issue', 'text'],
];

// Fixed dispatch (repair) cost applied to every site in the ROI card.
// Change this one value to update payback for the whole portfolio.
export const DISPATCH_COST = 2000;
