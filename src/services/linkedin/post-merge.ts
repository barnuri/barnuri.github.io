import type { LinkedInPost } from '../../schemas/linkedin/linkedin-post.ts';
import type { PostCollection } from '../../schemas/linkedin/post-collection.ts';

/** LinkedIn's lazy loading can skip a post on one run, so keep saved posts and let fresh copies replace them. */
export function mergePostCollections(saved: PostCollection | null, fresh: PostCollection): PostCollection {
  const byId = new Map<string, LinkedInPost>((saved?.posts ?? []).map((post) => [post.id, post]));
  for (const post of fresh.posts) {
    byId.set(post.id, post);
  }
  return {
    ...fresh,
    posts: [...byId.values()].toSorted((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? '')),
  };
}
