/**
 * Currency & Date formatting utilities
 */

export const formatCurrency = (amount: number | string | null | undefined, symbol: string = '₹'): string => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return `${symbol}0.00`;
  }
  const num = Number(amount);
  return `${symbol}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (dateString?: string | Date | null): string => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return String(dateString);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatTime = (timeString?: string | Date | null): string => {
  if (!timeString) return 'N/A';
  const d = new Date(timeString);
  if (isNaN(d.getTime())) return String(timeString);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};
