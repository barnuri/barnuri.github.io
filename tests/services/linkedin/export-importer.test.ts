import { describe, expect, test } from 'bun:test';
import { ExportFormatError } from '../../../src/errors/export-format-error.ts';
import { ExportImporter } from '../../../src/services/linkedin/export-importer.ts';

const HEADER = 'Date,ShareLink,ShareCommentary,SharedUrl,MediaUrl,Visibility\n';
const ROW =
  '2024-12-05 10:11:12,https://www.linkedin.com/feed/update/urn%3Ali%3Ashare%3A7270000000000000000,' +
  '"First line\nsecond ""quoted"" line",https://github.com/barnuri/x,,MEMBER_NETWORK\n';

const importer = new ExportImporter(() => new Date('2026-10-16T00:00:00Z'));

describe('ExportImporter.parse', () => {
  test('maps export rows to posts', () => {
    const collection = importer.parse(HEADER + ROW, 'Shares.csv');

    expect(collection.source).toBe('export');
    expect(collection.posts[0]).toMatchObject({
      id: 'urn:li:share:7270000000000000000',
      text: 'First line\nsecond "quoted" line',
      published_at: '2024-12-05T10:11:12.000Z',
      visibility: 'MEMBER_NETWORK',
    });
    expect(collection.posts[0]?.media[0]?.url).toBe('https://github.com/barnuri/x');
  });

  test('fails when required columns are missing', () => {
    expect(() => importer.parse('Date,Text\n2024-01-01,hi\n', 'Shares.csv')).toThrow(ExportFormatError);
  });

  test('keeps a post with an unparseable date', () => {
    const collection = importer.parse(HEADER + ROW.replace('2024-12-05 10:11:12', 'yesterday'), 'Shares.csv');

    expect(collection.posts[0]?.published_at).toBeNull();
  });

  test('reports engagement as unavailable', () => {
    const collection = importer.parse(HEADER + ROW, 'Shares.csv');

    expect(collection.unavailable_fields).toEqual(['engagement.likes', 'engagement.comments', 'engagement.shares']);
  });
});

describe('ExportImporter.load', () => {
  test('fails on a missing file', async () => {
    await expect(importer.load('/nonexistent/Shares.csv')).rejects.toThrow(ExportFormatError);
  });
});
