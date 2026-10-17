import type { GitHubStats } from '../../schemas/github/github-stats.ts';
import type { GraphqlActivity } from '../../schemas/github/graphql-activity.ts';
import type { GraphqlProfile } from '../../schemas/github/graphql-profile.ts';
import type { LanguageShare } from '../../schemas/github/language-share.ts';

const LANGUAGE_COUNT = 8;
const PERCENT = 100;

export function toLanguageShares(profile: GraphqlProfile): LanguageShare[] {
  const bytes = new Map<string, { color: string | null; size: number }>();
  for (const repo of profile.owned.nodes) {
    for (const edge of repo.languages.edges) {
      const current = bytes.get(edge.node.name) ?? { color: edge.node.color, size: 0 };
      bytes.set(edge.node.name, { color: current.color ?? edge.node.color, size: current.size + edge.size });
    }
  }
  const total = [...bytes.values()].reduce((sum, language) => sum + language.size, 0);
  if (total === 0) {
    return [];
  }
  return [...bytes.entries()]
    .map(([name, { color, size }]) => ({ name, color, share: Math.round((size / total) * PERCENT * 10) / 10 }))
    .toSorted((a, b) => b.share - a.share)
    .slice(0, LANGUAGE_COUNT);
}

export function toStats(profile: GraphqlProfile, activity: GraphqlActivity): GitHubStats {
  return {
    publicRepos: profile.owned.totalCount,
    stars: profile.owned.nodes.reduce((sum, repo) => sum + repo.stargazerCount, 0),
    followers: profile.followers.totalCount,
    languages: toLanguageShares(profile),
    year: {
      commits: activity.totalCommitContributions,
      pullRequests: activity.totalPullRequestContributions,
      reviews: activity.totalPullRequestReviewContributions,
      issues: activity.totalIssueContributions,
      reposCreated: activity.totalRepositoryContributions,
      contributedRepos: activity.totalRepositoriesWithContributedCommits,
    },
  };
}
