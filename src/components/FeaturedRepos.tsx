import type { Repo } from '../schemas/github/repo.ts';
import { formatNumber } from '../services/site/format.ts';
import { RepoMeta } from './RepoMeta.tsx';

interface FeaturedReposProps {
  readonly repos: readonly Repo[];
}

export function FeaturedRepos({ repos }: FeaturedReposProps) {
  return (
    <section className="repos" aria-labelledby="featured-heading">
      <h2 id="featured-heading">Most starred</h2>
      <ol className="repo-grid">
        {repos.map((repo) => (
          <li key={repo.name} className="repo">
            <a className="repo-name" href={repo.url}>
              {repo.name}
            </a>
            {repo.description && <p className="repo-description">{repo.description}</p>}
            <RepoMeta repo={repo}>
              <span className="repo-stars">
                {formatNumber(repo.stars)} {repo.stars === 1 ? 'star' : 'stars'}
              </span>
            </RepoMeta>
          </li>
        ))}
      </ol>
    </section>
  );
}
