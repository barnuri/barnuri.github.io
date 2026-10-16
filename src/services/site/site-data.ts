import type { LinkedInPost } from '../../schemas/linkedin/linkedin-post.ts';
import type { PostCollection } from '../../schemas/linkedin/post-collection.ts';

const LINKEDIN_POST_COUNT = 4;

export function selectLinkedInPosts(collection: PostCollection | null): LinkedInPost[] {
  return (collection?.posts ?? [])
    .filter((post) => post.text.trim() && post.url)
    .toSorted((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''))
    .slice(0, LINKEDIN_POST_COUNT);
}
