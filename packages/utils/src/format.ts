export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-GB').format(n);
}
