import { describe, expect, test } from 'bun:test';
import { activityIdToDate, cleanPostText, parseCount, richerPost, toBrowserPost } from '../../../src/services/linkedin/browser-post.ts';

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
  const raw = {
    activityId: '7516617810928771072',
    text: '  I juggle a work and a personal GitHub account.  ',
    reactionsText: '50 Nir Berger and 49 others',
    commentsText: '8 comments',
    repostsText: '3 reposts',
    imageUrls: ['https://media.licdn.com/dms/image/v2/a/feedshare-shrink_800/x'],
    video: { src: 'https://dms.licdn.com/playlist/vid/v2/a/mp4-720p/x', poster: 'https://media.licdn.com/dms/image/v2/a/videocover/x' },
    hasDocument: false,
    articleUrl: 'https://github.com/barnuri/ghx',
  };

  test('builds a post with date, link, local media and counts but no reactor names', () => {
    const post = toBrowserPost(raw, {
      images: ['/assets/linkedin/7516617810928771072-1.jpg'],
      video: { src: '/assets/linkedin/7516617810928771072-video.mp4', poster: '/assets/linkedin/7516617810928771072-poster.jpg' },
    });

    expect(post).toEqual({
      id: 'urn:li:activity:7516617810928771072',
      text: 'I juggle a work and a personal GitHub account.',
      published_at: '2026-10-15T21:55:38.131Z',
      url: 'https://www.linkedin.com/feed/update/urn:li:activity:7516617810928771072/',
      visibility: null,
      media: [
        { kind: 'image', urn: null, url: '/assets/linkedin/7516617810928771072-1.jpg', title: null, poster: null },
        {
          kind: 'video',
          urn: null,
          url: '/assets/linkedin/7516617810928771072-video.mp4',
          title: null,
          poster: '/assets/linkedin/7516617810928771072-poster.jpg',
        },
        { kind: 'article', urn: null, url: 'https://github.com/barnuri/ghx', title: null, poster: null },
      ],
      engagement: { likes: 50, comments: 8, shares: 3 },
    });
    expect(JSON.stringify(post)).not.toContain('Nir Berger');
  });

  test('keeps a video entry without a local file so the page can link to LinkedIn', () => {
    const post = toBrowserPost({ ...raw, imageUrls: [], articleUrl: null });

    expect(post.media).toEqual([{ kind: 'video', urn: null, url: null, title: null, poster: null }]);
  });
});

describe('richerPost', () => {
  const base = { ...{ activityId: '1', text: '', reactionsText: null, commentsText: null, repostsText: null, hasDocument: false, articleUrl: null } };

  test('keeps the sighting with more media', () => {
    const empty = { ...base, imageUrls: [], video: null };
    const loaded = { ...base, imageUrls: ['https://media.licdn.com/a'], video: null };

    expect(richerPost(empty, loaded)).toBe(loaded);
    expect(richerPost(loaded, empty)).toBe(loaded);
  });
});

describe('cleanPostText', () => {
  test('drops the hidden hashtag label LinkedIn puts before each hashtag', () => {
    expect(cleanPostText('Apply today hashtag #CheckPointCareers hashtag #WeAreHiring')).toBe('Apply today #CheckPointCareers #WeAreHiring');
  });

  test('keeps the word hashtag when no hashtag follows', () => {
    expect(cleanPostText('a hashtag is a tag')).toBe('a hashtag is a tag');
  });
});
