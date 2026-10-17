import { describe, expect, test } from 'bun:test';
import { cleanDescription, parseDateRange, toEducation, toPosition } from '../../../src/services/linkedin/profile-lines.ts';
import { ProfileImporter } from '../../../src/services/linkedin/profile-importer.ts';

describe('parseDateRange', () => {
  test('reads month ranges, year ranges and ongoing roles', () => {
    expect(parseDateRange('Feb 2025 - Present · 1 yr 9 mos')).toEqual({ startedOn: { year: 2025, month: 2 }, finishedOn: null });
    expect(parseDateRange('2016 - 2019')).toEqual({ startedOn: { year: 2016, month: null }, finishedOn: { year: 2019, month: null } });
    expect(parseDateRange('Israel')).toBeNull();
  });
});

describe('cleanDescription', () => {
  test('drops header lines, skills lines and see-more links, comparing normalized whitespace', () => {
    const rest = 'Technology Leader\nAI  &  Innovation Team\nBuilds agents.\nSkills: Python, +3 skills\n…see more';

    expect(cleanDescription(rest, ['Technology Leader', 'AI & Innovation Team'])).toBe('Builds agents.');
  });
});

describe('toPosition', () => {
  test('takes the company from its own line for a single role', () => {
    const position = toPosition({ lines: ['Software Engineer', 'KELA · Full-time', 'Aug 2020 - Dec 2021 · 1 yr 5 mos', 'Tel Aviv District, Israel'], groupHeader: null, rest: '' });

    expect(position).toMatchObject({ company: 'KELA', title: 'Software Engineer', location: 'Tel Aviv District, Israel', finishedOn: { year: 2021, month: 12 } });
  });

  test('takes the company from the group heading for grouped roles', () => {
    const position = toPosition({ lines: ['Technology Leader', 'Feb 2025 - Present · 1 yr 9 mos', 'Israel'], groupHeader: 'Check Point Software', rest: '' });

    expect(position).toMatchObject({ company: 'Check Point Software', location: 'Israel', finishedOn: null });
  });

  test('skips an entry without dates', () => {
    expect(toPosition({ lines: ['Only a title'], groupHeader: null, rest: '' })).toBeNull();
  });
});

describe('toEducation', () => {
  test('reads school, degree and year range', () => {
    const entry = toEducation({ lines: ['The Open University of Israel', 'Bachelor of Science - BS, Computer Science', '2016 - 2019'], groupHeader: null, rest: '' });

    expect(entry).toEqual({
      school: 'The Open University of Israel',
      degree: 'Bachelor of Science - BS, Computer Science',
      notes: null,
      startedOn: { year: 2016, month: null },
      finishedOn: { year: 2019, month: null },
    });
  });
});

describe('ProfileImporter.parseHeadlineAndSummary', () => {
  test('reads only headline and summary', () => {
    const csv = 'First Name,Last Name,Address,Birth Date,Headline,Summary\nBar,Nuri,Secret street 1,Jan 1,Technology Leader,Builds agents\n';

    const about = ProfileImporter.parseHeadlineAndSummary(csv);

    expect(about).toEqual({ headline: 'Technology Leader', summary: 'Builds agents' });
    expect(JSON.stringify(about)).not.toContain('Secret street');
  });
});
