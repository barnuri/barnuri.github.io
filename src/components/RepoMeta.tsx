import type { ReactNode } from 'react';
import type { Repo } from '../schemas/github/repo.ts';
import { safeColor } from '../services/site/format.ts';

interface RepoMetaProps {
  readonly repo: Repo;
  readonly children: ReactNode;
}

export function RepoMeta({ repo, children }: RepoMetaProps) {
  return (
    <p className="repo-meta">
      {repo.language && (
        <span className="repo-language">
          <span className="language-dot" style={{ background: safeColor(repo.languageColor) }} aria-hidden="true" />
          {repo.language}
        </span>
      )}
      {children}
    </p>
  );
}
