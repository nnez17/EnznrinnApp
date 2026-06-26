export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

export const parseCurrency = (value: string): number => {
  return parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
};

export const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat('id-ID').format(amount);
};

export const formatNumberInput = (value: string): string => {
  const num = value.replace(/\D/g, '');
  if (!num) return '';
  const n = parseInt(num, 10);
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const parseFormattedNumber = (value: string): number => {
  return parseInt(value.replace(/\D/g, ''), 10) || 0;
};