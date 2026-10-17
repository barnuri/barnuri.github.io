import { describe, expect, test } from 'bun:test';
import type { LinkedInPost } from '../../../src/schemas/linkedin/linkedin-post.ts';
import type { PostCollection } from '../../../src/schemas/linkedin/post-collection.ts';
import { mergePostCollections } from '../../../src/services/linkedin/post-merge.ts';

const post = (id: string, publishedAt: string, likes: number): LinkedInPost => ({
  id,
  text: id,
  published_at: publishedAt,
  url: `https://www.linkedin.com/feed/update/${id}/`,
  visibility: null,
  media: [],
  engagement: { likes, comments: null, shares: null },
});

const collection = (posts: LinkedInPost[], fetchedAt: string): PostCollection => ({
  source: 'browser',
  fetched_at: fetchedAt,
  author_urn: null,
  posts,
  unavailable_fields: [],
});

describe('mergePostCollections', () => {
  test('keeps saved posts that did not load, prefers fresh copies, and sorts newest first', () => {
    const saved = collection([post('a', '2025-01-29T00:00:00.000Z', 20), post('b', '2026-05-04T00:00:00.000Z', 10)], '2026-10-16T00:00:00.000Z');
    const fresh = collection([post('b', '2026-05-04T00:00:00.000Z', 16), post('c', '2026-10-15T00:00:00.000Z', 9)], '2026-10-17T00:00:00.000Z');

    const merged = mergePostCollections(saved, fresh);

    expect(merged.posts.map((item) => item.id)).toEqual(['c', 'b', 'a']);
    expect(merged.posts[1]?.engagement.likes).toBe(16);
    expect(merged.fetched_at).toBe('2026-10-17T00:00:00.000Z');
  });

  test('uses the fresh posts when nothing is saved', () => {
    const fresh = collection([post('c', '2026-10-15T00:00:00.000Z', 9)], '2026-10-17T00:00:00.000Z');

    expect(mergePostCollections(null, fresh)).toEqual(fresh);
  });
});
