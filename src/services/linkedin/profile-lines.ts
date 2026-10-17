import type { Education } from '../../schemas/linkedin/education.ts';
import type { MonthYear } from '../../schemas/linkedin/month-year.ts';
import type { Position } from '../../schemas/linkedin/position.ts';
import { ProfileImporter } from './profile-importer.ts';

export interface RawProfileEntry {
  readonly lines: readonly string[];
  readonly groupHeader: string | null;
  readonly groupDetail?: string | null;
  readonly rest: string;
  readonly formId?: string | null;
  readonly logoUrl?: string | null;
  readonly skills?: readonly string[];
}

const EMPLOYMENT_TYPES = /^(Full-time|Part-time|Self-employed|Freelance|Contract|Internship|Apprenticeship|Seasonal|Temporary)$/i;

const DATE_RANGE = /^((?:[A-Za-z]{3,9}\.?\s+)?\d{4})\s*[-–]\s*(Present|(?:[A-Za-z]{3,9}\.?\s+)?\d{4})/;
const DETAIL_SEPARATOR = ' · ';
const DROPPED_LINE = /^(skills:|…\s*see more|see more|show all)|\+\d+ skills?$/i;

export function parseDateRange(text: string): { startedOn: MonthYear | null; finishedOn: MonthYear | null } | null {
  const match = text.trim().match(DATE_RANGE);
  if (!match?.[1] || !match[2]) {
    return null;
  }
  return {
    startedOn: ProfileImporter.parseMonthYear(match[1]),
    finishedOn: /present/i.test(match[2]) ? null : ProfileImporter.parseMonthYear(match[2]),
  };
}

const normalize = (text: string): string => text.replace(/\s+/g, ' ').trim();

const SKILLS_DIALOG_TITLE = /^Skills for /i;
const SKILLS_DIALOG_END = /^Learn more about these skills/i;

export function parseSkillsDialog(text: string): string[] {
  const lines = text.split('\n').map(normalize).filter(Boolean);
  const start = lines.findIndex((line) => SKILLS_DIALOG_TITLE.test(line));
  if (start < 0) {
    return [];
  }
  const end = lines.findIndex((line, index) => index > start && SKILLS_DIALOG_END.test(line));
  return [...new Set(lines.slice(start + 1, end < 0 ? undefined : end))];
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'company';
}

export function cleanDescription(rest: string, lines: readonly string[]): string {
  const known = new Set(lines.map(normalize));
  return rest
    .split('\n')
    .map(normalize)
    .filter((line) => line && !known.has(line) && !DROPPED_LINE.test(line))
    .join('\n');
}

const beforeSeparator = (text: string): string => text.split(DETAIL_SEPARATOR)[0]?.trim() ?? text.trim();

export function employmentTypeOf(...texts: readonly (string | null | undefined)[]): string | null {
  for (const text of texts) {
    const type = text
      ?.split(DETAIL_SEPARATOR)
      .map((part) => part.trim())
      .find((part) => EMPLOYMENT_TYPES.test(part));
    if (type) {
      return type;
    }
  }
  return null;
}

export function toPosition(entry: RawProfileEntry): Position | null {
  const lines = entry.lines.map((line) => line.trim()).filter(Boolean);
  const dateIndex = lines.findIndex((line) => parseDateRange(line) !== null);
  const title = lines[0];
  if (!title || dateIndex < 1) {
    return null;
  }
  const dates = parseDateRange(lines[dateIndex] ?? '');
  const companyLine = dateIndex > 1 ? lines[1] : null;
  const company = companyLine ? beforeSeparator(companyLine) : entry.groupHeader ? beforeSeparator(entry.groupHeader) : '';
  return {
    company,
    title,
    description: cleanDescription(entry.rest, lines),
    location: lines[dateIndex + 1] ? beforeSeparator(lines[dateIndex + 1] ?? '') : null,
    startedOn: dates?.startedOn ?? null,
    finishedOn: dates?.finishedOn ?? null,
    companyLogo: null,
    employmentType: employmentTypeOf(companyLine, entry.groupDetail),
    skills: [...(entry.skills ?? [])],
  };
}

export function toEducation(entry: RawProfileEntry): Education | null {
  const lines = entry.lines.map((line) => line.trim()).filter(Boolean);
  const school = lines[0];
  if (!school) {
    return null;
  }
  const dateIndex = lines.findIndex((line) => parseDateRange(line) !== null);
  const dates = dateIndex >= 0 ? parseDateRange(lines[dateIndex] ?? '') : null;
  const degreeLine = lines.slice(1).find((line, index) => index + 1 !== dateIndex);
  const notes = cleanDescription(entry.rest, lines);
  return {
    school,
    degree: degreeLine ?? null,
    notes: notes || null,
    startedOn: dates?.startedOn ?? null,
    finishedOn: dates?.finishedOn ?? null,
  };
}
