const EXCERPT_LENGTH = 280;
const HEX_COLOR = /^#[0-9a-f]{3,8}$/i;

const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const monthFormat = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });
const numberFormat = new Intl.NumberFormat('en-US');

export function formatDate(isoDate: string): string {
  return dateFormat.format(new Date(isoDate));
}

export function formatMonth(isoDate: string): string {
  return monthFormat.format(new Date(isoDate));
}

export function formatNumber(value: number): string {
  return numberFormat.format(value);
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
