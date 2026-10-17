import type { LinkedInPost } from '../../schemas/linkedin/linkedin-post.ts';
import type { PostCollection } from '../../schemas/linkedin/post-collection.ts';

export function selectLinkedInPosts(collection: PostCollection | null): LinkedInPost[] {
  return (collection?.posts ?? [])
    .filter((post) => post.text.trim() && post.url)
    .toSorted((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''));
}
