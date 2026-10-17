import { PROFILE_LEDE } from '../consts/site.ts';
import type { LinkedInPost } from '../schemas/linkedin/linkedin-post.ts';
import type { LinkedInProfile } from '../schemas/linkedin/linkedin-profile.ts';
import { Education } from './Education.tsx';
import { Experience } from './Experience.tsx';
import { LinkedInPosts } from './LinkedInPosts.tsx';
import { PageLayout } from './PageLayout.tsx';
import { ProfileIntro } from './ProfileIntro.tsx';
import { Tile } from './Tile.tsx';

interface AboutPageProps {
  readonly profile: LinkedInProfile | null;
  readonly posts: readonly LinkedInPost[];
  readonly builtAt: string;
  readonly stylesheet: string;
}

export function AboutPage({ profile, posts, builtAt, stylesheet }: AboutPageProps) {
  return (
    <PageLayout current="about" title="About" builtAt={builtAt} stylesheet={stylesheet}>
      <div className="bento">
        <section className="tile span-6" aria-label="Profile">
          <ProfileIntro lede={profile?.headline ?? PROFILE_LEDE} />
          {profile?.summary && (
            <p className="timeline-text" dir="auto" style={{ marginTop: 18 }}>
              {profile.summary}
            </p>
          )}
        </section>
        <Tile id="experience" title="Experience" span={6}>
          <Experience positions={profile?.positions ?? []} />
        </Tile>
        <Tile id="education" title="Education" span={6}>
          <Education entries={profile?.education ?? []} />
        </Tile>
        <Tile id="posts" title="LinkedIn posts" span={6} note={posts.length > 0 ? `${posts.length} posts` : undefined}>
          <LinkedInPosts id="about-posts" posts={posts} paged />
        </Tile>
      </div>
    </PageLayout>
  );
}
