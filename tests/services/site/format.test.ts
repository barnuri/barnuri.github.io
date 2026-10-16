import { describe, expect, test } from 'bun:test';
import { excerpt, formatDate, formatNumber, formatRange, safeColor } from '../../../src/services/site/format.ts';

describe('format helpers', () => {
  test('formats dates in UTC and numbers with separators', () => {
    expect(formatDate('2026-10-14T23:30:00Z')).toBe('Oct 14, 2026');
    expect(formatNumber(2911)).toBe('2,911');
  });

  test('allows only hex colors', () => {
    expect(safeColor('#3178c6')).toBe('#3178c6');
    expect(safeColor('red;background:url(x)')).toBe('currentColor');
    expect(safeColor(null)).toBe('currentColor');
  });

  test('keeps short text and cuts long text at a word boundary', () => {
    expect(excerpt('one\n\ntwo')).toBe('one two');
    const cut = excerpt('word '.repeat(100));
    expect(cut.length).toBeLessThanOrEqual(281);
    expect(cut.endsWith('word…')).toBe(true);
  });
});

describe('formatRange', () => {
  test('formats month ranges, year ranges, ongoing roles and missing dates', () => {
    expect(formatRange({ year: 2022, month: 3 }, null)).toBe('Mar 2022 – Present');
    expect(formatRange({ year: 2015, month: null }, { year: 2019, month: null })).toBe('2015 – 2019');
    expect(formatRange(null, { year: 2019, month: 6 })).toBe('Jun 2019');
    expect(formatRange(null, null)).toBe('');
  });
});
