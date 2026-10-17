import type { MonthYear } from '../../schemas/linkedin/month-year.ts';

const EXCERPT_LENGTH = 280;
const HEX_COLOR = /^#[0-9a-f]{3,8}$/i;

const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const monthFormat = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });
const shortDateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const numberFormat = new Intl.NumberFormat('en-US');

export function formatDate(isoDate: string): string {
  return dateFormat.format(new Date(isoDate));
}

export function formatShortDate(isoDate: string, now: Date = new Date()): string {
  const date = new Date(isoDate);
  return date.getUTCFullYear() === now.getUTCFullYear() ? shortDateFormat.format(date) : formatDate(isoDate);
}

export function formatMonth(isoDate: string): string {
  return monthFormat.format(new Date(isoDate));
}

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

export function formatMonthYear(date: MonthYear): string {
  if (date.month === null) {
    return String(date.year);
  }
  return monthFormat.format(new Date(Date.UTC(date.year, date.month - 1, 1))) + ` ${date.year}`;
}

export function formatRange(startedOn: MonthYear | null, finishedOn: MonthYear | null): string {
  if (startedOn === null) {
    return finishedOn ? formatMonthYear(finishedOn) : '';
  }
  return `${formatMonthYear(startedOn)} – ${finishedOn ? formatMonthYear(finishedOn) : 'Present'}`;
}

export function safeColor(color: string | null): string {
  return color && HEX_COLOR.test(color) ? color : 'currentColor';
}

export function excerpt(text: string): string {
  const flattened = text.replace(/\s+/g, ' ').trim();
  if (flattened.length <= EXCERPT_LENGTH) {
    return flattened;
  }
  const cut = flattened.slice(0, EXCERPT_LENGTH);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : EXCERPT_LENGTH)}…`;
}
