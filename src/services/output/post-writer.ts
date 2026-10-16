import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { LinkedInPost } from '../../schemas/linkedin/linkedin-post.ts';
import type { PostCollection } from '../../schemas/linkedin/post-collection.ts';

export class PostWriter {
  static readonly JSON_FILE_NAME = 'linkedin_posts.json';
  static readonly MARKDOWN_FILE_NAME = 'linkedin_posts.md';

  constructor(private readonly outputDir: string) {}

  async write(collection: PostCollection): Promise<{ jsonPath: string; markdownPath: string }> {
    const ordered: PostCollection = { ...collection, posts: PostWriter.newestFirst(collection.posts) };
    await mkdir(this.outputDir, { recursive: true });
    const jsonPath = join(this.outputDir, PostWriter.JSON_FILE_NAME);
    const markdownPath = join(this.outputDir, PostWriter.MARKDOWN_FILE_NAME);
    await Bun.write(jsonPath, `${JSON.stringify(ordered, null, 2)}\n`);
    await Bun.write(markdownPath, PostWriter.toMarkdown(ordered));
    return { jsonPath, markdownPath };
  }

  static newestFirst(posts: readonly LinkedInPost[]): LinkedInPost[] {
    return posts.toSorted((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''));
  }

  static toMarkdown(collection: PostCollection): string {
    const fetched = collection.fetched_at.slice(0, 16).replace('T', ' ');
    const lines = ['# LinkedIn posts', '', `${collection.posts.length} posts, source: ${collection.source}, fetched ${fetched} UTC.`, ''];
    for (const post of PostWriter.newestFirst(collection.posts)) {
      lines.push(`## ${post.published_at?.slice(0, 10) ?? 'Unknown date'}`, '', post.text || '_No text._', '', `[Open on LinkedIn](${post.url})`);
      lines.push(...post.media.map((item) => `- ${item.kind}: ${item.title ?? item.url ?? item.urn ?? ''}`));
      const metrics = PostWriter.metricsLine(post);
      if (metrics) {
        lines.push('', metrics);
      }
      lines.push('');
    }
    return lines.join('\n');
  }

  static summary(collection: PostCollection): string {
    const dates = collection.posts.flatMap((post) => (post.published_at ? [post.published_at.slice(0, 10)] : [])).toSorted();
    return [
      `Total posts: ${collection.posts.length}`,
      `Oldest post: ${dates.at(0) ?? 'n/a'}`,
      `Newest post: ${dates.at(-1) ?? 'n/a'}`,
      `Unavailable fields: ${collection.unavailable_fields.join(', ') || 'none'}`,
    ].join('\n');
  }

  private static metricsLine(post: LinkedInPost): string {
    const parts: string[] = [];
    if (post.engagement.likes !== null) {
      parts.push(`${post.engagement.likes} likes`);
    }
    if (post.engagement.comments !== null) {
      parts.push(`${post.engagement.comments} comments`);
    }
    return parts.join(', ');
  }
}
