import { formatCurrency } from './format';

export function faralinsToGbp(faralins: number, faralinsPerGbp: number): number {
  if (faralinsPerGbp <= 0) return 0;
  return Math.round((faralins / faralinsPerGbp) * 100) / 100;
}

export function formatFaralinPerGbp(faralinsPerGbp: number): string {
  return `${faralinsPerGbp.toLocaleString('en-GB')} Faralins ≈ £1`;
}

export function formatFaralinGbpEstimate(faralins: number, faralinsPerGbp: number): string {
  return `≈ ${formatCurrency(faralinsToGbp(faralins, faralinsPerGbp))}`;
}

export function exampleGbpAtFaralins(
  faralinsPerGbp: number,
  exampleFaralins = 1000,
): string {
  const gbp = faralinsToGbp(exampleFaralins, faralinsPerGbp);
  return `${exampleFaralins.toLocaleString('en-GB')} Faralins ≈ ${formatCurrency(gbp)}`;
}

export const FARALIN_CONVERSION_DISCLAIMER =
  'Indicative only. Based on Guardian University Guide 2025 tiers. Subject to admission and university terms.';
