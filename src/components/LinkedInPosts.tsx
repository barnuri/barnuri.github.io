import { LINKEDIN_URL, POSTS_PAGE_SIZE } from '../consts/site.ts';
import type { LinkedInPost } from '../schemas/linkedin/linkedin-post.ts';
import { excerpt, formatDate, formatNumber } from '../services/site/format.ts';

interface LinkedInPostsProps {
  readonly id: string;
  readonly posts: readonly LinkedInPost[];
  readonly paged?: boolean;
}

const plural = (count: number, word: string): string => `${formatNumber(count)} ${word}${count === 1 ? '' : 's'}`;

export function LinkedInPosts({ id, posts, paged = false }: LinkedInPostsProps) {
  if (posts.length === 0) {
    return (
      <p className="empty-state">
        No posts imported yet. <a href={LINKEDIN_URL}>Read them on LinkedIn</a>.
      </p>
    );
  }
  return (
    <>
      <ul id={id} className="post-list" data-paged-list={paged ? '' : undefined} data-step={POSTS_PAGE_SIZE}>
        {posts.map((post, index) => (
          <li key={post.id} className="post" data-item={paged ? '' : undefined} data-side="all" hidden={paged && index >= POSTS_PAGE_SIZE}>
            {post.published_at && <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>}
            <p className="post-text" dir="auto">
              {excerpt(post.text)}
            </p>
            <p className="post-meta">
              {post.engagement.likes !== null && <span>{plural(post.engagement.likes, 'reaction')}</span>}
              {post.engagement.comments !== null && <span>{plural(post.engagement.comments, 'comment')}</span>}
              <a className="post-link" href={post.url}>
                Read on LinkedIn
              </a>
            </p>
          </li>
        ))}
      </ul>
      {paged && posts.length > POSTS_PAGE_SIZE && (
        <button type="button" className="more-button" data-more-for={id} hidden>
          Show more
        </button>
      )}
    </>
  );
}
