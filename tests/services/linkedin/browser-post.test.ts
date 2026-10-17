import { describe, expect, test } from 'bun:test';
import { activityIdToDate, parseCount, toBrowserPost } from '../../../src/services/linkedin/browser-post.ts';

describe('activityIdToDate', () => {
  test('decodes the timestamp LinkedIn encodes in an activity id', () => {
    expect(activityIdToDate('7516617810928771072')).toBe('2026-10-15T21:55:38.131Z');
  });

  test('rejects ids that are not numeric', () => {
    expect(activityIdToDate('abc')).toBeNull();
    expect(activityIdToDate('')).toBeNull();
  });
});

describe('parseCount', () => {
  test('reads the leading number and drops thousands separators', () => {
    expect(parseCount('1,204 Nir Berger and 1,203 others')).toBe(1204);
  });

  test('returns null for missing text', () => {
    expect(parseCount(null)).toBeNull();
    expect(parseCount('no numbers here')).toBeNull();
  });
});

describe('toBrowserPost', () => {
  test('builds a post with date, link, media and counts but no reactor names', () => {
    const post = toBrowserPost({
      activityId: '7516617810928771072',
      text: '  I juggle a work and a personal GitHub account.  ',
      reactionsText: '50 Nir Berger and 49 others',
      commentsText: '8 comments',
      repostsText: '3 reposts',
      mediaKinds: ['image'],
      articleUrl: 'https://github.com/barnuri/ghx',
    });

    expect(post).toEqual({
      id: 'urn:li:activity:7516617810928771072',
      text: 'I juggle a work and a personal GitHub account.',
      published_at: '2026-10-15T21:55:38.131Z',
      url: 'https://www.linkedin.com/feed/update/urn:li:activity:7516617810928771072/',
      visibility: null,
      media: [
        { kind: 'image', urn: null, url: null, title: null },
        { kind: 'article', urn: null, url: 'https://github.com/barnuri/ghx', title: null },
      ],
      engagement: { likes: 50, comments: 8, shares: 3 },
    });
    expect(JSON.stringify(post)).not.toContain('Nir Berger');
  });
});
