import { describe, expect, test } from 'bun:test';
import type { Position } from '../../../src/schemas/linkedin/position.ts';
import { formatDuration, groupPositions, monthsBetween } from '../../../src/services/site/experience-groups.ts';

const NOW = new Date('2026-10-17T00:00:00Z');

const role = (company: string, title: string, startedOn: Position['startedOn'], finishedOn: Position['finishedOn']): Position => ({
  company,
  title,
  description: '',
  location: null,
  startedOn,
  finishedOn,
  companyLogo: company === 'Check Point Software' ? '/assets/linkedin/logos/check-point-software.jpg' : null,
  employmentType: 'Full-time',
  skills: [],
});

describe('monthsBetween and formatDuration', () => {
  test('match LinkedIn durations, counting both the first and the last month', () => {
    expect(formatDuration(monthsBetween({ year: 2025, month: 2 }, null, NOW))).toBe('1 yr 9 mos');
    expect(formatDuration(monthsBetween({ year: 2020, month: 8 }, { year: 2021, month: 12 }, NOW))).toBe('1 yr 5 mos');
    expect(formatDuration(monthsBetween({ year: 2017, month: 11 }, { year: 2018, month: 6 }, NOW))).toBe('8 mos');
    expect(formatDuration(monthsBetween({ year: 2015, month: null }, { year: 2015, month: null }, NOW))).toBe('1 yr');
  });

  test('return null without a start date', () => {
    expect(monthsBetween(null, null, NOW)).toBeNull();
    expect(formatDuration(null)).toBeNull();
  });
});

describe('groupPositions', () => {
  test('nests consecutive roles at the same company and spans their dates', () => {
    const groups = groupPositions([
      role('Check Point Software', 'Technology Leader', { year: 2025, month: 2 }, null),
      role('Check Point Software', 'Software Engineer', { year: 2021, month: 12 }, { year: 2025, month: 1 }),
      role('KELA', 'Software Engineer', { year: 2020, month: 8 }, { year: 2021, month: 12 }),
    ]);

    expect(groups.map((group) => [group.company, group.roles.length])).toEqual([
      ['Check Point Software', 2],
      ['KELA', 1],
    ]);
    expect(groups[0]).toMatchObject({ startedOn: { year: 2021, month: 12 }, finishedOn: null, logo: '/assets/linkedin/logos/check-point-software.jpg' });
    expect(formatDuration(monthsBetween(groups[0]?.startedOn ?? null, groups[0]?.finishedOn ?? null, NOW))).toBe('4 yrs 11 mos');
  });

  test('keeps a return to an earlier company as a separate entry', () => {
    const groups = groupPositions([
      role('A', 'Lead', { year: 2024, month: 1 }, null),
      role('B', 'Dev', { year: 2022, month: 1 }, { year: 2023, month: 12 }),
      role('A', 'Dev', { year: 2020, month: 1 }, { year: 2021, month: 12 }),
    ]);

    expect(groups.map((group) => group.company)).toEqual(['A', 'B', 'A']);
  });
});
