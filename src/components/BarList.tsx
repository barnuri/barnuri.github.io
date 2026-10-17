import type { ActivitySide, RepoCount } from '../services/site/activity-view.ts';
import { formatNumber } from '../services/site/format.ts';

interface BarListProps {
  readonly repos: readonly RepoCount[];
  readonly side: ActivitySide;
  readonly unit: string;
}

export function BarList({ repos, side, unit }: BarListProps) {
  if (repos.length === 0) {
    return <p className="empty-state">Nothing in the saved activity yet.</p>;
  }
  const largest = repos[0]?.count ?? 1;
  return (
    <ul className="bar-list">
      {repos.map((repo) => (
        <li key={repo.name} className="bar-row">
          <a href={repo.url}>{repo.name}</a>
          <span className="bar-track" aria-hidden="true">
            <span className={`bar-fill fill-${side}`} style={{ width: `${(repo.count / largest) * 100}%` }} />
          </span>
          <span className="bar-value" aria-label={`${formatNumber(repo.count)} ${unit}`}>
            {formatNumber(repo.count)}
          </span>
        </li>
      ))}
    </ul>
  );
}
