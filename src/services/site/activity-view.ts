import type { ActivityItem } from '../../schemas/github/activity-item.ts';

export type ActivitySide = 'own' | 'ext';

export interface RepoCount {
  readonly name: string;
  readonly url: string;
  readonly count: number;
}

export interface ContributionSummary {
  readonly pullRequests: number;
  readonly merged: number;
  readonly open: number;
  readonly closed: number;
  readonly reviews: number;
  readonly issues: number;
  readonly repos: readonly RepoCount[];
}

export function sideOf(item: ActivityItem, login: string): ActivitySide {
  return item.repo.name.toLowerCase().startsWith(`${login.toLowerCase()}/`) ? 'own' : 'ext';
}

export function itemsOn(items: readonly ActivityItem[], login: string, side: ActivitySide): ActivityItem[] {
  return items.filter((item) => sideOf(item, login) === side);
}

const countByRepo = (items: readonly ActivityItem[], weight: (item: ActivityItem) => number): RepoCount[] => {
  const counts = new Map<string, RepoCount>();
  for (const item of items) {
    const current = counts.get(item.repo.name) ?? { name: item.repo.name, url: item.repo.url, count: 0 };
    counts.set(item.repo.name, { ...current, count: current.count + weight(item) });
  }
  return [...counts.values()].filter((repo) => repo.count > 0).toSorted((a, b) => b.count - a.count || a.name.localeCompare(b.name));
};

export function mostActiveOwnRepos(items: readonly ActivityItem[], login: string, limit: number): RepoCount[] {
  return countByRepo(itemsOn(items, login, 'own'), (item) => (item.kind === 'commits' ? (item.count ?? 1) : 0)).slice(0, limit);
}

export function contributionSummary(items: readonly ActivityItem[], login: string): ContributionSummary {
  const external = itemsOn(items, login, 'ext');
  const pullRequests = external.filter((item) => item.kind === 'pull_request');
  return {
    pullRequests: pullRequests.length,
    merged: pullRequests.filter((item) => item.state === 'MERGED').length,
    open: pullRequests.filter((item) => item.state === 'OPEN').length,
    closed: pullRequests.filter((item) => item.state === 'CLOSED').length,
    reviews: external.filter((item) => item.kind === 'review').length,
    issues: external.filter((item) => item.kind === 'issue').length,
    repos: countByRepo(external, (item) => (item.kind === 'commits' ? (item.count ?? 1) : 1)),
  };
}
