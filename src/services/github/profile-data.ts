import type { Contributions } from '../../schemas/github/contributions.ts';
import type { ContributionCalendar, RepoNode } from '../../schemas/github/graphql-profile.ts';
import type { Repo } from '../../schemas/github/repo.ts';

const FEATURED_COUNT = 6;
const RECENT_COUNT = 6;
const LEVEL_QUANTILES = [0.25, 0.5, 0.75] as const;

export function toRepo(node: RepoNode): Repo {
  return {
    name: node.name,
    description: node.description ?? '',
    url: node.url,
    stars: node.stargazerCount,
    language: node.primaryLanguage?.name ?? null,
    languageColor: node.primaryLanguage?.color ?? null,
    pushedAt: node.pushedAt,
  };
}

export function selectRepos(
  login: string,
  starredNodes: readonly RepoNode[],
  recentNodes: readonly RepoNode[],
): { featured: Repo[]; recent: Repo[] } {
  const isShowcase = (node: RepoNode): boolean => !node.isFork && !node.isArchived && node.name !== `${login}.github.io`;

  const featured = starredNodes
    .filter((node) => isShowcase(node) && node.stargazerCount > 0)
    .slice(0, FEATURED_COUNT)
    .map(toRepo);

  const featuredNames = new Set(featured.map((repo) => repo.name));
  const recent = recentNodes
    .filter((node) => isShowcase(node) && !featuredNames.has(node.name))
    .slice(0, RECENT_COUNT)
    .map(toRepo);

  return { featured, recent };
}

export function toContributions(calendar: ContributionCalendar): Contributions {
  const activeCounts = calendar.weeks
    .flatMap((week) => week.contributionDays.map((day) => day.contributionCount))
    .filter((count) => count > 0)
    .toSorted((a, b) => a - b);

  const thresholds = LEVEL_QUANTILES.map((quantile) => activeCounts[Math.floor(activeCounts.length * quantile)] ?? 0);
  const levelOf = (count: number): number => {
    if (count === 0) {
      return 0;
    }
    return 1 + thresholds.filter((threshold) => count > threshold).length;
  };

  return {
    total: calendar.totalContributions,
    weeks: calendar.weeks.map((week) =>
      week.contributionDays.map((day) => ({
        date: day.date,
        count: day.contributionCount,
        level: levelOf(day.contributionCount),
      })),
    ),
  };
}
