import { GITHUB_LOGIN } from '../consts/site.ts';
import type { GitHubData } from '../schemas/github/github-data.ts';
import { contributionSummary, itemsOn } from '../services/site/activity-view.ts';
import { ActivityFeed } from './ActivityFeed.tsx';
import { BarList } from './BarList.tsx';
import { PageLayout } from './PageLayout.tsx';
import { StatList } from './StatList.tsx';
import { Tile } from './Tile.tsx';

interface ContributionsPageProps {
  readonly github: GitHubData;
  readonly builtAt: string;
  readonly stylesheet: string;
}

export function ContributionsPage({ github, builtAt, stylesheet }: ContributionsPageProps) {
  const summary = contributionSummary(github.activity.items, GITHUB_LOGIN);
  return (
    <PageLayout current="contributions" title="Contributions" builtAt={builtAt} stylesheet={stylesheet}>
      <h1 className="page-title">Contributions</h1>
      <p className="page-lede">Pull requests, reviews and issues in repositories that other people and teams own.</p>
      <div className="bento">
        <Tile id="totals" title="Totals" span={6} note="from saved activity">
          <StatList
            stats={[
              { label: 'pull requests', value: summary.pullRequests },
              { label: 'merged', value: summary.merged },
              { label: 'open', value: summary.open },
              { label: 'closed', value: summary.closed },
              { label: 'reviews', value: summary.reviews },
              { label: 'repositories', value: summary.repos.length },
            ]}
          />
        </Tile>
        <Tile id="repos" title="By repository" span={6} note="pull requests, reviews, issues and commits">
          <BarList repos={summary.repos} side="ext" unit="contributions" />
        </Tile>
        <Tile id="ext-activity" title="Activity in other repos" span={6}>
          <ActivityFeed id="contributions-feed" items={itemsOn(github.activity.items, GITHUB_LOGIN, 'ext')} emptyText="No contributions saved yet." />
        </Tile>
      </div>
    </PageLayout>
  );
}
