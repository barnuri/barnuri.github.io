import { describe, expect, test } from 'bun:test';
import type { LinkedInProfile } from '../../../src/schemas/linkedin/linkedin-profile.ts';
import { LinkedInArchiveImporter } from '../../../src/services/linkedin/archive-importer.ts';
import { ExportImporter } from '../../../src/services/linkedin/export-importer.ts';
import { ProfileImporter } from '../../../src/services/linkedin/profile-importer.ts';

const NOW = () => new Date('2026-10-17T00:00:00Z');
const importer = new LinkedInArchiveImporter(new ExportImporter(NOW), new ProfileImporter(NOW));

const SHARES =
  'Date,ShareLink,ShareCommentary,SharedUrl,MediaUrl,Visibility\n' +
  '2026-05-05 09:00:00,https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A1,Public post,,,PUBLIC\n' +
  '2026-04-01 09:00:00,https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A2,Network post,,,CONNECTIONS\n';
const POSITIONS = 'Company Name,Title,Description,Location,Started On,Finished On\nCheck Point,Developer,,,Mar 2022,\n';
const EDUCATION = 'School Name,Start Date,End Date,Notes,Degree Name,Activities\nOpen University,2015,2019,,B.Sc.,\n';

const existingProfile: LinkedInProfile = {
  imported_at: '2026-10-01T00:00:00.000Z',
  headline: null,
  summary: null,
  positions: [],
  education: [{ school: 'Kept School', degree: null, notes: null, startedOn: null, finishedOn: null }],
};

describe('LinkedInArchiveImporter.build', () => {
  test('builds posts and profile and counts post visibility', () => {
    const result = importer.build({ shares: SHARES, positions: POSITIONS, education: EDUCATION }, null);

    expect(result.posts?.posts).toHaveLength(2);
    expect(result.postVisibility).toEqual({ PUBLIC: 1, CONNECTIONS: 1 });
    expect(result.profile?.positions[0]?.company).toBe('Check Point');
    expect(result.profile?.education[0]?.school).toBe('Open University');
  });

  test('keeps existing education when the export has only positions', () => {
    const result = importer.build({ positions: POSITIONS }, existingProfile);

    expect(result.posts).toBeNull();
    expect(result.profile?.positions).toHaveLength(1);
    expect(result.profile?.education[0]?.school).toBe('Kept School');
  });

  test('builds nothing when the export has none of the files', () => {
    expect(importer.build({}, existingProfile)).toEqual({ posts: null, profile: null, postVisibility: {} });
  });
});
