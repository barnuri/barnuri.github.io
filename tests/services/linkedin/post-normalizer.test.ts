import { describe, expect, test } from 'bun:test';
import {
  cleanCommentary,
  extractMedia,
  normalizePost,
  toEngagement,
} from '../../../src/services/linkedin/post-normalizer.ts';

const POST_URN = 'urn:li:share:6856921137721544704';
const PUBLISHED_AT = 1634817394721;
const PUBLISHED_ISO = '2021-10-21T11:56:34.721Z';

describe('cleanCommentary', () => {
  test('turns hashtag templates into plain hashtags', () => {
    expect(cleanCommentary('Follow best practices {hashtag|\\#|coding}')).toBe('Follow best practices #coding');
  });

  test('keeps the display name of mentions', () => {
    expect(cleanCommentary('Hello @[Devtestco](urn:li:organization:2414183)')).toBe('Hello Devtestco');
  });

  test('unescapes reserved characters', () => {
    expect(cleanCommentary('a \\(b\\) \\[c\\] \\*d\\*')).toBe('a (b) [c] *d*');
  });

  test('returns an empty string for missing commentary', () => {
    expect(cleanCommentary(null)).toBe('');
  });
});

describe('extractMedia', () => {
  test('lists every content type', () => {
    const media = extractMedia({
      content: {
        media: { id: 'urn:li:video:C5F10AQ', title: 'demo' },
        article: { source: 'https://example.com', title: 'An article' },
        multiImage: { images: [{ id: 'urn:li:image:1' }, { id: 'urn:li:image:2' }] },
        poll: { question: 'Tabs or spaces?' },
      },
      reshareContext: { parent: 'urn:li:share:1' },
    });

    expect(media.map((item) => item.kind)).toEqual(['video', 'article', 'image', 'image', 'poll', 'reshare']);
    expect(media.at(-1)?.url).toBe('https://www.linkedin.com/feed/update/urn:li:share:1/');
  });

  test('returns an empty list without content', () => {
    expect(extractMedia({})).toEqual([]);
  });
});

describe('toEngagement', () => {
  test('counts zero for an empty response and leaves shares unknown', () => {
    expect(toEngagement({})).toEqual({ likes: 0, comments: 0, shares: null });
  });

  test('reads like and comment totals', () => {
    const engagement = toEngagement({ likesSummary: { totalLikes: 7 }, commentsSummary: { aggregatedTotalComments: 3 } });

    expect(engagement).toEqual({ likes: 7, comments: 3, shares: null });
  });
});

describe('normalizePost', () => {
  test('maps the post fields', () => {
    const post = normalizePost(
      { id: POST_URN, commentary: 'Hi', publishedAt: PUBLISHED_AT, visibility: 'PUBLIC' },
      { likes: 1, comments: 2, shares: null },
    );

    expect(post).toMatchObject({
      id: POST_URN,
      text: 'Hi',
      published_at: PUBLISHED_ISO,
      url: `https://www.linkedin.com/feed/update/${POST_URN}/`,
      visibility: 'PUBLIC',
    });
    expect(post.engagement.likes).toBe(1);
  });

  test('falls back to createdAt without publishedAt', () => {
    expect(normalizePost({ id: POST_URN, createdAt: PUBLISHED_AT }).published_at).toBe(PUBLISHED_ISO);
  });

  test('leaves the date empty without timestamps', () => {
    expect(normalizePost({ id: POST_URN }).published_at).toBeNull();
  });

  test('fails on a post without an id', () => {
    expect(() => normalizePost({ commentary: 'orphan' })).toThrow('without an id');
  });
});
