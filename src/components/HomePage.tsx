import { GITHUB_LOGIN, HOME_POST_COUNT, PAGES, PROFILE_LEDE, TOP_REPO_COUNT } from '../consts/site.ts';
import type { GitHubData } from '../schemas/github/github-data.ts';
import type { LinkedInPost } from '../schemas/linkedin/linkedin-post.ts';
import { contributionSummary, mostActiveOwnRepos } from '../services/site/activity-view.ts';
import { formatNumber } from '../services/site/format.ts';
import { ActivityFeed } from './ActivityFeed.tsx';
import { BarList } from './BarList.tsx';
import { ContributionGraph } from './ContributionGraph.tsx';
import { LanguageList } from './LanguageList.tsx';
import { LinkedInPosts } from './LinkedInPosts.tsx';
import { PageLayout } from './PageLayout.tsx';
import { ProfileIntro } from './ProfileIntro.tsx';
import { StatList } from './StatList.tsx';
import { Tile } from './Tile.tsx';

const HOME_REPO_COUNT = 3;

interface HomePageProps {
  readonly github: GitHubData;
  readonly linkedInPosts: readonly LinkedInPost[];
  readonly builtAt: string;
  readonly stylesheet: string;
}

export function HomePage({ github, linkedInPosts, builtAt, stylesheet }: HomePageProps) {
  const { stats } = github;
  const contributions = contributionSummary(github.activity.items, GITHUB_LOGIN);
  const ownRepos = mostActiveOwnRepos(github.activity.items, GITHUB_LOGIN, TOP_REPO_COUNT).slice(0, HOME_REPO_COUNT);
  return (
    <PageLayout current="home" builtAt={builtAt} stylesheet={stylesheet}>
      <div className="bento">
        <section className="tile span-4" aria-label="Profile">
          <ProfileIntro lede={PROFILE_LEDE} />
        </section>
        <Tile id="year" title="The last 12 months" span={2}>
          <StatList
            stats={[
              { label: 'commits', value: stats.year.commits },
              { label: 'pull requests', value: stats.year.pullRequests },
              { label: 'reviews', value: stats.year.reviews },
              { label: 'repos created', value: stats.year.reposCreated },
            ]}
          />
        </Tile>
        <Tile id="graph" title="Contributions" span={6} note={`${formatNumber(github.contributions.total)} in the last year`}>
          <div className="graph-scroll">
            <ContributionGraph contributions={github.contributions} />
          </div>
        </Tile>
        <Tile id="languages" title="Languages" span={2} note="in my repos">
          <LanguageList languages={stats.languages.slice(0, 6)} />
        </Tile>
        <Tile id="own" title="My repositories" span={2} titleClass="own-text" note={<a href={PAGES.projects.href}>All projects</a>}>
          <StatList
            stats={[
              { label: 'public repos', value: stats.publicRepos },
              { label: 'stars', value: stats.stars },
            ]}
          />
          <div style={{ marginTop: 16 }}>
            <BarList repos={ownRepos} side="own" unit="commits" />
          </div>
        </Tile>
        <Tile id="ext" title="Other people's repos" span={2} titleClass="ext-text" note={<a href={PAGES.contributions.href}>All contributions</a>}>
          <StatList
            stats={[
              { label: 'pull requests', value: contributions.pullRequests },
              { label: 'merged', value: contributions.merged },
            ]}
          />
          <div style={{ marginTop: 16 }}>
            <BarList repos={contributions.repos.slice(0, HOME_REPO_COUNT)} side="ext" unit="contributions" />
          </div>
        </Tile>
        <Tile id="activity" title="Recent activity" span={4}>
          <ActivityFeed id="home-feed" items={github.activity.items} filterable emptyText="No activity for this filter yet." />
          {github.activity.privateContributions > 0 && (
            <p className="private-note">
              Plus {formatNumber(github.activity.privateContributions)} contributions in private repositories in the last year.
            </p>
          )}
        </Tile>
        <Tile id="linkedin" title="Latest on LinkedIn" span={2} note={<a href={PAGES.posts.href}>All posts</a>}>
          <LinkedInPosts id="home-posts" posts={linkedInPosts.slice(0, HOME_POST_COUNT)} compact />
        </Tile>
      </div>
    </PageLayout>
  );
}
