import type { GitHubData } from '../schemas/github/github-data.ts';
import type { LinkedInPost } from '../schemas/linkedin/linkedin-post.ts';
import { formatDate, formatNumber } from '../services/site/format.ts';
import { ContributionGraph } from './ContributionGraph.tsx';
import { Document } from './Document.tsx';
import { FeaturedRepos } from './FeaturedRepos.tsx';
import { LinkedInPosts } from './LinkedInPosts.tsx';
import { ProfileIntro } from './ProfileIntro.tsx';
import { RecentRepos } from './RecentRepos.tsx';

interface HomePageProps {
  readonly github: GitHubData;
  readonly linkedInPosts: readonly LinkedInPost[];
  readonly builtAt: string;
  readonly stylesheet: string;
}

export function HomePage({ github, linkedInPosts, builtAt, stylesheet }: HomePageProps) {
  return (
    <Document
      title="Bar Nuri"
      description="Bar Nuri, software developer at Check Point. Open-source tools for coding agents and developer workflows."
      stylesheet={stylesheet}
    >
      <main className="page">
        <ProfileIntro />
        <section className="activity" aria-labelledby="activity-heading">
          <h2 id="activity-heading">The last year on GitHub</h2>
          <div className="graph-scroll">
            <ContributionGraph contributions={github.contributions} />
          </div>
          <p className="graph-caption">
            <strong>{formatNumber(github.contributions.total)} contributions</strong> in the last 12 months.
          </p>
        </section>
        <LinkedInPosts posts={linkedInPosts} />
        <FeaturedRepos repos={github.featured} />
        <RecentRepos repos={github.recent} />
        <footer>
          <p>This page rebuilds from GitHub and LinkedIn data. Last built {formatDate(builtAt)}.</p>
        </footer>
      </main>
    </Document>
  );
}
