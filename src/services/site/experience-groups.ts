import type { MonthYear } from '../../schemas/linkedin/month-year.ts';
import type { Position } from '../../schemas/linkedin/position.ts';

const MONTHS_PER_YEAR = 12;
const FIRST_MONTH = 1;

export interface CompanyGroup {
  readonly company: string;
  readonly logo: string | null;
  readonly employmentType: string | null;
  readonly startedOn: MonthYear | null;
  readonly finishedOn: MonthYear | null;
  readonly roles: readonly Position[];
}

const toIndex = (date: MonthYear, fallbackMonth: number): number => date.year * MONTHS_PER_YEAR + (date.month ?? fallbackMonth) - 1;

const fromNow = (now: Date): MonthYear => ({ year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 });

/** Counts both the first and the last month, the way LinkedIn shows durations. */
export function monthsBetween(startedOn: MonthYear | null, finishedOn: MonthYear | null, now: Date = new Date()): number | null {
  if (!startedOn) {
    return null;
  }
  const end = finishedOn ?? fromNow(now);
  const months = toIndex(end, MONTHS_PER_YEAR) - toIndex(startedOn, FIRST_MONTH) + 1;
  return months > 0 ? months : null;
}

export function formatDuration(months: number | null): string | null {
  if (months === null) {
    return null;
  }
  const years = Math.floor(months / MONTHS_PER_YEAR);
  const rest = months % MONTHS_PER_YEAR;
  const parts = [
    years > 0 ? `${years} ${years === 1 ? 'yr' : 'yrs'}` : null,
    rest > 0 ? `${rest} ${rest === 1 ? 'mo' : 'mos'}` : null,
  ].filter((part): part is string => part !== null);
  return parts.join(' ') || null;
}

const sameCompany = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

const earlier = (a: MonthYear | null, b: MonthYear | null): MonthYear | null => {
  if (!a || !b) {
    return a ?? b;
  }
  return toIndex(a, FIRST_MONTH) <= toIndex(b, FIRST_MONTH) ? a : b;
};

const later = (a: MonthYear | null, b: MonthYear | null): MonthYear | null =>
  toIndex(a ?? { year: 0, month: 1 }, MONTHS_PER_YEAR) >= toIndex(b ?? { year: 0, month: 1 }, MONTHS_PER_YEAR) ? a : b;

/** Groups consecutive roles at the same company, newest first, the way LinkedIn nests them. */
export function groupPositions(positions: readonly Position[]): CompanyGroup[] {
  const groups: CompanyGroup[] = [];
  for (const position of positions) {
    const last = groups.at(-1);
    if (last && sameCompany(last.company, position.company)) {
      const ongoing = last.finishedOn === null || position.finishedOn === null;
      groups[groups.length - 1] = {
        ...last,
        logo: last.logo ?? position.companyLogo,
        employmentType: last.employmentType ?? position.employmentType,
        startedOn: earlier(last.startedOn, position.startedOn),
        finishedOn: ongoing ? null : later(last.finishedOn, position.finishedOn),
        roles: [...last.roles, position],
      };
      continue;
    }
    groups.push({
      company: position.company,
      logo: position.companyLogo,
      employmentType: position.employmentType,
      startedOn: position.startedOn,
      finishedOn: position.finishedOn,
      roles: [position],
    });
  }
  return groups;
}
