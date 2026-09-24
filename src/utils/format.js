import { NOISE_TEXT } from '../constants.js';

export const formatNumber = (value, digits = 0) => (
  value == null || Number.isNaN(Number(value))
    ? '—'
    : Number(value).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
);

export const formatPercent = (value, digits = 1) => (
  value == null || Number.isNaN(Number(value)) ? '—' : `${(Number(value) * 100).toFixed(digits)}%`
);

export const cleanText = (value) => (NOISE_TEXT.has(value) ? '' : String(value));

export const safeFilename = (value = 'export') => String(value)
  .replace(/[^\w-]+/g, '_').replace(/_+/g, '_').slice(0, 60);

export async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
