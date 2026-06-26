import { format, parseISO, isValid, differenceInDays, addDays, startOfDay } from 'date-fns';
import { id } from 'date-fns/locale';

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '-';
  return format(d, 'dd MMM yyyy', { locale: id });
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '-';
  return format(d, 'dd MMM yyyy, HH:mm', { locale: id });
};

export const formatShortDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '-';
  return format(d, 'dd/MM/yyyy', { locale: id });
};

export const formatTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '-';
  return format(d, 'HH:mm', { locale: id });
};

export const getDaysUntil = (deadline: string): number => {
  const target = parseISO(deadline);
  const today = startOfDay(new Date());
  return differenceInDays(target, today);
};

export const getDaysSince = (date: string): number => {
  const start = parseISO(date);
  const today = startOfDay(new Date());
  return differenceInDays(today, start);
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const toISOString = (date: Date = new Date()): string => {
  return date.toISOString();
};

export const parseDateString = (dateStr: string): Date | null => {
  const parsed = parseISO(dateStr);
  return isValid(parsed) ? parsed : null;
};