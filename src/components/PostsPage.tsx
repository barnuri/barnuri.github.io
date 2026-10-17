import { LINKEDIN_URL } from '../consts/site.ts';
import type { LinkedInPost } from '../schemas/linkedin/linkedin-post.ts';
import { LinkedInPosts } from './LinkedInPosts.tsx';
import { PageLayout } from './PageLayout.tsx';
import { StatList } from './StatList.tsx';
import { Tile } from './Tile.tsx';

interface PostsPageProps {
  readonly posts: readonly LinkedInPost[];
  readonly builtAt: string;
  readonly stylesheet: string;
}

export function PostsPage({ posts, builtAt, stylesheet }: PostsPageProps) {
  const reactions = posts.reduce((sum, post) => sum + (post.engagement.likes ?? 0), 0);
  const comments = posts.reduce((sum, post) => sum + (post.engagement.comments ?? 0), 0);
  return (
    <PageLayout current="posts" title="Posts" builtAt={builtAt} stylesheet={stylesheet}>
      <h1 className="page-title">Posts</h1>
      <p className="page-lede">
        What I write on LinkedIn, newest first. <a href={LINKEDIN_URL}>Follow me on LinkedIn</a> for new posts.
      </p>
      <div className="bento">
        {posts.length > 0 && (
          <Tile id="totals" title="Totals" span={6}>
            <StatList
              stats={[
                { label: 'posts', value: posts.length },
                { label: 'reactions', value: reactions },
                { label: 'comments', value: comments },
              ]}
            />
          </Tile>
        )}
        <Tile id="all-posts" title="All posts" span={6}>
          <LinkedInPosts id="all-posts-list" posts={posts} paged />
        </Tile>
      </div>
    </PageLayout>
  );
}
