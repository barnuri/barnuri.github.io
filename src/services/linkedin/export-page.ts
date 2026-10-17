import { EXPORT_PAGE_PATH, LOGIN_PATH_PREFIXES } from '../../consts/linkedin-api.ts';

export type ExportPageState = 'login' | 'export' | 'other';

const LINKEDIN_HOST = /(^|\.)linkedin\.com$/i;
const UNSAFE_FILE_CHARACTERS = /[^A-Za-z0-9._-]+/g;

export function exportPageState(url: string): ExportPageState {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return 'other';
  }
  if (!LINKEDIN_HOST.test(parsed.hostname)) {
    return 'other';
  }
  if (LOGIN_PATH_PREFIXES.some((prefix) => parsed.pathname.startsWith(prefix))) {
    return 'login';
  }
  return parsed.pathname.startsWith(EXPORT_PAGE_PATH) ? 'export' : 'other';
}

export function archiveFileName(suggested: string, now: Date): string {
  const base = (suggested.split(/[\\/]/).pop() ?? '').replace(UNSAFE_FILE_CHARACTERS, '_').replace(/^[._]+/, '');
  if (!base || base === 'zip') {
    return `LinkedInDataExport_${now.toISOString().slice(0, 10)}.zip`;
  }
  const withoutZip = base.replace(/(\.zip)+$/i, '');
  return `${withoutZip}.zip`;
}

export function isRecentArchive(modified: Date, now: Date, maxAgeHours: number): boolean {
  const ageMs = now.getTime() - modified.getTime();
  return ageMs >= 0 && ageMs <= maxAgeHours * 3_600_000;
}
