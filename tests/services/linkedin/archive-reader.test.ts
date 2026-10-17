import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdir, mkdtemp, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { strToU8, zipSync } from 'fflate';
import { ExportFormatError } from '../../../src/errors/export-format-error.ts';
import { LinkedInArchiveReader } from '../../../src/services/linkedin/archive-reader.ts';

const zipOf = (files: Record<string, string>): Uint8Array =>
  zipSync(Object.fromEntries(Object.entries(files).map(([name, text]) => [name, strToU8(text)])));

describe('LinkedInArchiveReader', () => {
  let directory: string;
  const reader = new LinkedInArchiveReader();

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'archive-reader-'));
  });

  afterEach(async () => {
    await Bun.$`trash ${directory}`.quiet().nothrow();
  });

  test('reads only the wanted files from a zip, at any depth, ignoring case', async () => {
    const zipPath = join(directory, 'Basic_LinkedInDataExport_10-16-2026.zip');
    await Bun.write(
      zipPath,
      zipOf({ 'Positions.csv': 'positions', 'nested/education.CSV': 'education', 'Messages.csv': 'private', 'Connections.csv': 'private' }),
    );

    const { contents } = await reader.read(zipPath);

    expect(contents).toEqual({ positions: 'positions', education: 'education' });
  });

  test('takes each file from the newest zip that has it', async () => {
    const older = join(directory, 'Basic_LinkedInDataExport_1.zip');
    const newer = join(directory, 'Complete_LinkedInDataExport_2.zip');
    await Bun.write(older, zipOf({ 'Positions.csv': 'old positions', 'Education.csv': 'old education' }));
    await Bun.write(newer, zipOf({ 'Positions.csv': 'new positions', 'Shares.csv': 'shares' }));
    await utimes(older, new Date('2026-10-01'), new Date('2026-10-01'));
    await utimes(newer, new Date('2026-10-02'), new Date('2026-10-02'));

    const { contents } = await reader.read(directory);

    expect(contents).toEqual({ positions: 'new positions', education: 'old education', shares: 'shares' });
  });

  test('reads extracted CSV files from a folder', async () => {
    await mkdir(join(directory, 'export'));
    await Bun.write(join(directory, 'export', 'Shares.csv'), 'shares');

    expect((await reader.read(directory)).contents).toEqual({ shares: 'shares' });
  });

  test('fails on a folder with no export', async () => {
    await Bun.write(join(directory, 'README.md'), 'instructions');

    await expect(reader.read(directory)).rejects.toThrow(ExportFormatError);
  });

  test('fails on a missing path', async () => {
    await expect(reader.read(join(directory, 'missing'))).rejects.toThrow('does not exist');
  });

  test('fails on a file that is not a zip', async () => {
    const path = join(directory, 'export.zip');
    await Bun.write(path, 'not a zip');

    await expect(reader.read(path)).rejects.toThrow('could not be read as a zip');
  });
});
