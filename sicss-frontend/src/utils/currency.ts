export type CurrencyCode = 'USD' | 'LRD';

export const currencyOptions: Array<{ code: CurrencyCode; label: string }> = [
  { code: 'LRD', label: 'Liberian dollar (LRD)' },
  { code: 'USD', label: 'United States dollar (USD)' },
];

export function formatCurrency(value: number | string | null | undefined, currency: CurrencyCode = 'LRD') {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('en-LR', {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
    minimumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}
