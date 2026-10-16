import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ExportFormatError } from '../../../src/errors/export-format-error.ts';
import { ProfileImporter } from '../../../src/services/linkedin/profile-importer.ts';

const POSITIONS =
  'Company Name,Title,Description,Location,Started On,Finished On\n' +
  'Old Corp,Junior Developer,,Haifa,Jan 2016,Feb 2019\n' +
  'Check Point,Software Developer,"Agents, tooling",Tel Aviv,Mar 2022,\n' +
  'Middle Ltd,Developer,,,Mar 2019,Feb 2022\n';
const EDUCATION =
  'School Name,Start Date,End Date,Notes,Degree Name,Activities\n' +
  'High School,2009,2012,,,\n' +
  'Open University,2015,2019,Graduated with honors,B.Sc. Computer Science,\n';

const importer = new ProfileImporter(() => new Date('2026-10-16T00:00:00Z'));

describe('ProfileImporter.parseMonthYear', () => {
  test('reads month-year, year-only and empty values', () => {
    expect(ProfileImporter.parseMonthYear('Mar 2022')).toEqual({ year: 2022, month: 3 });
    expect(ProfileImporter.parseMonthYear('September 2020')).toEqual({ year: 2020, month: 9 });
    expect(ProfileImporter.parseMonthYear('2015')).toEqual({ year: 2015, month: null });
    expect(ProfileImporter.parseMonthYear('')).toBeNull();
    expect(ProfileImporter.parseMonthYear('soon')).toBeNull();
  });
});

describe('ProfileImporter.parse', () => {
  test('maps positions and puts the current role first', () => {
    const { positions } = importer.parse(POSITIONS, '');

    expect(positions.map((position) => position.company)).toEqual(['Check Point', 'Middle Ltd', 'Old Corp']);
    expect(positions[0]).toMatchObject({
      title: 'Software Developer',
      description: 'Agents, tooling',
      location: 'Tel Aviv',
      startedOn: { year: 2022, month: 3 },
      finishedOn: null,
    });
    expect(positions[1]?.location).toBeNull();
  });

  test('maps education newest first', () => {
    const { education } = importer.parse('', EDUCATION);

    expect(education.map((entry) => entry.school)).toEqual(['Open University', 'High School']);
    expect(education[0]).toMatchObject({ degree: 'B.Sc. Computer Science', notes: 'Graduated with honors' });
    expect(education[1]?.degree).toBeNull();
  });

  test('fails with the found columns when a required column is missing', () => {
    expect(() => importer.parse('Company,Role\nA,B\n', '')).toThrow('Found: Company, Role');
  });
});

describe('ProfileImporter.loadDir', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'profile-importer-'));
  });

  afterEach(async () => {
    await Bun.$`trash ${directory}`.quiet().nothrow();
  });

  test('reads whichever export files exist', async () => {
    await Bun.write(join(directory, 'Positions.csv'), POSITIONS);

    const profile = await importer.loadDir(directory);

    expect(profile.positions).toHaveLength(3);
    expect(profile.education).toEqual([]);
  });

  test('fails when neither export file exists', async () => {
    await expect(importer.loadDir(directory)).rejects.toThrow(ExportFormatError);
  });
});
