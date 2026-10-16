import type { Repo } from '../schemas/github/repo.ts';
import { formatDate } from '../services/site/format.ts';
import { RepoMeta } from './RepoMeta.tsx';

interface RecentReposProps {
  readonly repos: readonly Repo[];
}

export function RecentRepos({ repos }: RecentReposProps) {
  return (
    <section className="repos" aria-labelledby="recent-heading">
      <h2 id="recent-heading">Recently updated</h2>
      <ul className="recent-list">
        {repos.map((repo) => (
          <li key={repo.name} className="recent">
            <a className="repo-name" href={repo.url}>
              {repo.name}
            </a>
            {repo.description && <p className="repo-description">{repo.description}</p>}
            <RepoMeta repo={repo}>
              <time dateTime={repo.pushedAt}>Updated {formatDate(repo.pushedAt)}</time>
            </RepoMeta>
          </li>
        ))}
      </ul>
    </section>
  );
}
