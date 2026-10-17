import { describe, expect, test } from 'bun:test';
import { archiveFileName, exportPageState, isRecentArchive } from '../../../src/services/linkedin/export-page.ts';

const NOW = new Date('2026-10-17T12:00:00Z');

describe('exportPageState', () => {
  test('recognizes the export page, login pages and everything else', () => {
    expect(exportPageState('https://www.linkedin.com/mypreferences/d/download-my-data')).toBe('export');
    expect(exportPageState('https://www.linkedin.com/login?session_redirect=x')).toBe('login');
    expect(exportPageState('https://www.linkedin.com/uas/login-submit')).toBe('login');
    expect(exportPageState('https://www.linkedin.com/checkpoint/challenge/abc')).toBe('login');
    expect(exportPageState('https://www.linkedin.com/feed/')).toBe('other');
  });

  test('treats other hosts and invalid URLs as other', () => {
    expect(exportPageState('https://evil.example/mypreferences/d/download-my-data')).toBe('other');
    expect(exportPageState('https://linkedin.com.evil.example/login')).toBe('other');
    expect(exportPageState('not a url')).toBe('other');
  });
});

describe('archiveFileName', () => {
  test('keeps a safe LinkedIn file name', () => {
    expect(archiveFileName('Basic_LinkedInDataExport_10-17-2026.zip', NOW)).toBe('Basic_LinkedInDataExport_10-17-2026.zip');
  });

  test('strips directories and unsafe characters, and adds the zip extension', () => {
    expect(archiveFileName('../../etc/my export', NOW)).toBe('my_export.zip');
  });

  test('falls back to a dated name when nothing usable remains', () => {
    expect(archiveFileName('', NOW)).toBe('LinkedInDataExport_2026-10-17.zip');
    expect(archiveFileName('..', NOW)).toBe('LinkedInDataExport_2026-10-17.zip');
  });
});

describe('isRecentArchive', () => {
  test('accepts files from the last 24 hours and rejects older or future ones', () => {
    expect(isRecentArchive(new Date('2026-10-17T00:00:00Z'), NOW, 24)).toBe(true);
    expect(isRecentArchive(new Date('2026-10-16T11:59:00Z'), NOW, 24)).toBe(false);
    expect(isRecentArchive(new Date('2026-10-18T00:00:00Z'), NOW, 24)).toBe(false);
  });
});
