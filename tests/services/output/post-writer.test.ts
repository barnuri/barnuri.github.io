import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { LinkedInPost } from '../../../src/schemas/linkedin/linkedin-post.ts';
import type { PostCollection } from '../../../src/schemas/linkedin/post-collection.ts';
import { PostWriter } from '../../../src/services/output/post-writer.ts';

const makePost = (id: string, publishedAt: string | null, likes: number | null = null): LinkedInPost => ({
  id,
  text: `text ${id}`,
  published_at: publishedAt,
  url: `https://www.linkedin.com/feed/update/${id}/`,
  visibility: null,
  media: [],
  engagement: { likes, comments: likes === null ? null : 0, shares: null },
});

const collection: PostCollection = {
  source: 'api',
  fetched_at: '2026-10-16T09:00:00.000Z',
  author_urn: null,
  posts: [
    makePost('old', '2024-12-04T00:00:00.000Z'),
    makePost('undated', null),
    makePost('new', '2026-05-05T00:00:00.000Z', 12),
  ],
  unavailable_fields: ['engagement.shares'],
};

describe('PostWriter', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'post-writer-'));
  });

  afterEach(async () => {
    await Bun.$`trash ${directory}`.quiet().nothrow();
  });

  test('writes JSON and Markdown sorted newest first', async () => {
    const { jsonPath, markdownPath } = await new PostWriter(directory).write(collection);

    const stored = (await Bun.file(jsonPath).json()) as PostCollection;
    const markdown = await Bun.file(markdownPath).text();

    expect(stored.posts.map((post) => post.id)).toEqual(['new', 'old', 'undated']);
    expect(markdown.indexOf('## 2026-05-05')).toBeLessThan(markdown.indexOf('## 2024-12-04'));
    expect(markdown).toContain('12 likes, 0 comments');
    expect(markdown).toContain('## Unknown date');
  });

  test('summarizes counts, dates and unavailable fields', () => {
    const summary = PostWriter.summary(collection);

    expect(summary).toContain('Total posts: 3');
    expect(summary).toContain('Oldest post: 2024-12-04');
    expect(summary).toContain('Newest post: 2026-05-05');
    expect(summary).toContain('Unavailable fields: engagement.shares');
  });

  test('reports n/a dates for an empty collection', () => {
    const summary = PostWriter.summary({ ...collection, posts: [], unavailable_fields: [] });

    expect(summary).toContain('Oldest post: n/a');
    expect(summary).toContain('Unavailable fields: none');
  });
});
