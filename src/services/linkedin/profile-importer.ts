import { join } from 'node:path';
import { ExportFormatError } from '../../errors/export-format-error.ts';
import type { Education } from '../../schemas/linkedin/education.ts';
import type { LinkedInProfile } from '../../schemas/linkedin/linkedin-profile.ts';
import type { MonthYear } from '../../schemas/linkedin/month-year.ts';
import type { Position } from '../../schemas/linkedin/position.ts';
import { parseCsvRecords } from './csv.ts';

type CsvRecord = Record<string, string>;
interface DatedEntry {
  readonly startedOn: MonthYear | null;
  readonly finishedOn: MonthYear | null;
}

export class ProfileImporter {
  static readonly POSITIONS_FILE = 'Positions.csv';
  static readonly EDUCATION_FILE = 'Education.csv';
  static readonly POSITION_COLUMNS = ['Company Name', 'Title'] as const;
  static readonly EDUCATION_COLUMNS = ['School Name'] as const;
  static readonly MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  static readonly MONTH_YEAR_PATTERN = /^([A-Za-z]{3})[A-Za-z]*\.?\s+(\d{4})$/;
  static readonly YEAR_PATTERN = /^(\d{4})$/;

  constructor(private readonly now: () => Date = () => new Date()) {}

  async loadDir(exportDir: string): Promise<LinkedInProfile> {
    const positions = await ProfileImporter.readCsv(join(exportDir, ProfileImporter.POSITIONS_FILE));
    const education = await ProfileImporter.readCsv(join(exportDir, ProfileImporter.EDUCATION_FILE));
    if (positions === null && education === null) {
      throw new ExportFormatError(
        `${exportDir} has neither ${ProfileImporter.POSITIONS_FILE} nor ${ProfileImporter.EDUCATION_FILE}. ` +
          'Use the unzipped full LinkedIn data archive.',
      );
    }
    return this.parse(positions ?? '', education ?? '');
  }

  parse(positionsCsv: string, educationCsv: string): LinkedInProfile {
    return {
      imported_at: this.now().toISOString(),
      headline: null,
      summary: null,
      positions: ProfileImporter.records(positionsCsv, ProfileImporter.POSITION_COLUMNS, ProfileImporter.POSITIONS_FILE)
        .map((record) => ProfileImporter.toPosition(record))
        .toSorted(ProfileImporter.byMostRecent),
      education: ProfileImporter.records(educationCsv, ProfileImporter.EDUCATION_COLUMNS, ProfileImporter.EDUCATION_FILE)
        .map((record) => ProfileImporter.toEducation(record))
        .toSorted(ProfileImporter.byMostRecent),
    };
  }

  /** Reads only Headline and Summary; Profile.csv also holds address and birth date, which are never read. */
  static parseHeadlineAndSummary(profileCsv: string): { headline: string | null; summary: string | null } {
    const [record] = parseCsvRecords(profileCsv).records;
    return {
      headline: ProfileImporter.optional(record?.Headline),
      summary: ProfileImporter.optional(record?.Summary),
    };
  }

  static parseMonthYear(value: string | undefined): MonthYear | null {
    const text = value?.trim() ?? '';
    const yearOnly = text.match(ProfileImporter.YEAR_PATTERN);
    if (yearOnly?.[1]) {
      return { year: Number(yearOnly[1]), month: null };
    }
    const monthYear = text.match(ProfileImporter.MONTH_YEAR_PATTERN);
    const monthIndex = ProfileImporter.MONTHS.indexOf(monthYear?.[1]?.toLowerCase() ?? '');
    if (!monthYear?.[2] || monthIndex < 0) {
      return null;
    }
    return { year: Number(monthYear[2]), month: monthIndex + 1 };
  }

  private static async readCsv(path: string): Promise<string | null> {
    const file = Bun.file(path);
    return (await file.exists()) ? file.text() : null;
  }

  private static records(text: string, requiredColumns: readonly string[], fileName: string): CsvRecord[] {
    if (!text.trim()) {
      return [];
    }
    const { header, records } = parseCsvRecords(text);
    const missing = requiredColumns.filter((column) => !header.includes(column));
    if (missing.length > 0) {
      throw new ExportFormatError(`${fileName} is missing columns ${missing.join(', ')}. Found: ${header.join(', ')}.`);
    }
    return records;
  }

  private static optional(value: string | undefined): string | null {
    return value?.trim() || null;
  }

  private static toPosition(record: CsvRecord): Position {
    return {
      company: (record['Company Name'] ?? '').trim(),
      title: (record.Title ?? '').trim(),
      description: (record.Description ?? '').trim(),
      location: ProfileImporter.optional(record.Location),
      startedOn: ProfileImporter.parseMonthYear(record['Started On']),
      finishedOn: ProfileImporter.parseMonthYear(record['Finished On']),
    };
  }

  private static toEducation(record: CsvRecord): Education {
    return {
      school: (record['School Name'] ?? '').trim(),
      degree: ProfileImporter.optional(record['Degree Name']),
      notes: ProfileImporter.optional(record.Notes),
      startedOn: ProfileImporter.parseMonthYear(record['Start Date']),
      finishedOn: ProfileImporter.parseMonthYear(record['End Date']),
    };
  }

  private static toMonths(date: MonthYear | null): number {
    return date ? date.year * 12 + (date.month ?? 12) : 0;
  }

  private static recency(entry: DatedEntry): [end: number, start: number] {
    const isOngoing = entry.finishedOn === null && entry.startedOn !== null;
    const end = isOngoing ? Number.MAX_SAFE_INTEGER : ProfileImporter.toMonths(entry.finishedOn);
    return [end, ProfileImporter.toMonths(entry.startedOn)];
  }

  private static byMostRecent(a: DatedEntry, b: DatedEntry): number {
    const [aEnd, aStart] = ProfileImporter.recency(a);
    const [bEnd, bStart] = ProfileImporter.recency(b);
    return bEnd - aEnd || bStart - aStart;
  }
}
