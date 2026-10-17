import type { Repo } from '../schemas/github/repo.ts';
import { formatDate, formatNumber } from '../services/site/format.ts';
import { RepoMeta } from './RepoMeta.tsx';

interface RepoGridProps {
  readonly repos: readonly Repo[];
  readonly show: 'stars' | 'updated';
}

export function RepoGrid({ repos, show }: RepoGridProps) {
  if (repos.length === 0) {
    return <p className="empty-state">No repositories yet.</p>;
  }
  return (
    <ul className="repo-grid">
      {repos.map((repo) => (
        <li key={repo.name} className="repo-card">
          <a className="repo-name" href={repo.url}>
            {repo.name}
          </a>
          {repo.description && <p className="repo-description">{repo.description}</p>}
          <RepoMeta repo={repo}>
            {show === 'stars' ? (
              <span>
                {formatNumber(repo.stars)} {repo.stars === 1 ? 'star' : 'stars'}
              </span>
            ) : (
              <time dateTime={repo.pushedAt}>Updated {formatDate(repo.pushedAt)}</time>
            )}
          </RepoMeta>
        </li>
      ))}
    </ul>
  );
}
