import { GITHUB_LOGIN, TOP_REPO_COUNT } from '../consts/site.ts';
import type { GitHubData } from '../schemas/github/github-data.ts';
import { itemsOn, mostActiveOwnRepos } from '../services/site/activity-view.ts';
import { ActivityFeed } from './ActivityFeed.tsx';
import { BarList } from './BarList.tsx';
import { LanguageList } from './LanguageList.tsx';
import { PageLayout } from './PageLayout.tsx';
import { RepoGrid } from './RepoGrid.tsx';
import { StatList } from './StatList.tsx';
import { Tile } from './Tile.tsx';

interface ProjectsPageProps {
  readonly github: GitHubData;
  readonly builtAt: string;
  readonly stylesheet: string;
}

export function ProjectsPage({ github, builtAt, stylesheet }: ProjectsPageProps) {
  const { stats } = github;
  return (
    <PageLayout current="projects" title="Projects" builtAt={builtAt} stylesheet={stylesheet}>
      <h1 className="page-title">Projects</h1>
      <p className="page-lede">Open-source repositories I own: what they are written in, what is most used, and what I am working on now.</p>
      <div className="bento">
        <Tile id="totals" title="Totals" span={6}>
          <StatList
            stats={[
              { label: 'public repos', value: stats.publicRepos },
              { label: 'stars', value: stats.stars },
              { label: 'commits in 12 months', value: stats.year.commits },
              { label: 'repos created in 12 months', value: stats.year.reposCreated },
              { label: 'followers', value: stats.followers },
            ]}
          />
        </Tile>
        <Tile id="languages" title="Languages" span={2} note="share of code">
          <LanguageList languages={stats.languages} />
        </Tile>
        <Tile id="active" title="Most active" span={4} note="commits in saved activity">
          <BarList repos={mostActiveOwnRepos(github.activity.items, GITHUB_LOGIN, TOP_REPO_COUNT)} side="own" unit="commits" />
        </Tile>
        <Tile id="starred" title="Most starred" span={6}>
          <RepoGrid repos={github.featured} show="stars" />
        </Tile>
        <Tile id="updated" title="Recently updated" span={6}>
          <RepoGrid repos={github.recent} show="updated" />
        </Tile>
        <Tile id="own-activity" title="Activity in my repos" span={6}>
          <ActivityFeed id="projects-feed" items={itemsOn(github.activity.items, GITHUB_LOGIN, 'own')} emptyText="No activity in my repos yet." />
        </Tile>
      </div>
    </PageLayout>
  );
}
