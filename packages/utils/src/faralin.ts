import { formatCurrency } from './format';
import { CORE_FARALINS_PER_GBP, CONDITIONAL_AWARD_DISCLAIMER } from '@faralin/types';

export function coreFaralinsToGbp(coreFaralins: number): number {
  return Math.round((coreFaralins / CORE_FARALINS_PER_GBP) * 100) / 100;
}

export function formatCoreFaralins(amount: number): string {
  return `${amount.toLocaleString('en-GB')} Core Faralins`;
}

export function formatEstimatedAwardGbp(gbp: number): string {
  return `Est. conditional award ${formatCurrency(gbp)}`;
}

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

export const FARALIN_CONVERSION_DISCLAIMER = CONDITIONAL_AWARD_DISCLAIMER;
