import { describe, expect, test } from 'bun:test';
import type { LinkedInPost } from '../../../src/schemas/linkedin/linkedin-post.ts';
import { selectLinkedInPosts } from '../../../src/services/site/site-data.ts';

const post = (id: string, publishedAt: string | null, text = `post ${id}`): LinkedInPost => ({
  id,
  text,
  published_at: publishedAt,
  url: `https://www.linkedin.com/feed/update/${id}/`,
  visibility: null,
  media: [],
  engagement: { likes: null, comments: null, shares: null },
});

describe('selectLinkedInPosts', () => {
  test('returns the four newest posts that have text', () => {
    const posts = [
      post('a', '2024-01-01T00:00:00.000Z'),
      post('b', '2026-05-05T00:00:00.000Z'),
      post('empty', '2026-06-01T00:00:00.000Z', '  '),
      post('c', '2025-03-01T00:00:00.000Z'),
      post('d', '2025-08-01T00:00:00.000Z'),
      post('undated', null),
    ];
    const collection = { source: 'api' as const, fetched_at: '2026-10-16T00:00:00.000Z', author_urn: null, posts, unavailable_fields: [] };

    expect(selectLinkedInPosts(collection).map((item) => item.id)).toEqual(['b', 'd', 'c', 'a']);
  });

  test('returns nothing without a data file', () => {
    expect(selectLinkedInPosts(null)).toEqual([]);
  });
});
