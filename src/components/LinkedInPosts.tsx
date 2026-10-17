import type { LinkedInPost } from '../schemas/linkedin/linkedin-post.ts';
import { excerpt, formatDate } from '../services/site/format.ts';

interface LinkedInPostsProps {
  readonly posts: readonly LinkedInPost[];
}

export function LinkedInPosts({ posts }: LinkedInPostsProps) {
  if (posts.length === 0) {
    return null;
  }
  return (
    <section className="repos" aria-labelledby="linkedin-heading">
      <h2 id="linkedin-heading">Latest on LinkedIn</h2>
      <ul className="post-list">
        {posts.map((post) => (
          <li key={post.id} className="post">
            {post.published_at && <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>}
            <p className="post-text" dir="auto">{excerpt(post.text)}</p>
            <a className="post-link" href={post.url}>
              Read on LinkedIn
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
