import { describe, expect, test } from 'bun:test';
import type { RepoNode } from '../../../src/schemas/github/graphql-profile.ts';
import { selectRepos, toContributions, toRepo } from '../../../src/services/github/profile-data.ts';

const repoNode = (name: string, overrides: Partial<RepoNode> = {}): RepoNode => ({
  name,
  description: `${name} description`,
  url: `https://github.com/barnuri/${name}`,
  stargazerCount: 1,
  isFork: false,
  isArchived: false,
  primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
  pushedAt: '2026-10-14T10:00:00Z',
  ...overrides,
});

describe('toRepo', () => {
  test('maps a missing description and language to empty values', () => {
    const repo = toRepo(repoNode('bare', { description: null, primaryLanguage: null }));

    expect(repo.description).toBe('');
    expect(repo.language).toBeNull();
    expect(repo.languageColor).toBeNull();
  });
});

describe('selectRepos', () => {
  test('skips forks, archived repos, the pages repo and unstarred featured repos', () => {
    const starred = [
      repoNode('fork', { isFork: true, stargazerCount: 9 }),
      repoNode('archived', { isArchived: true, stargazerCount: 8 }),
      repoNode('barnuri.github.io', { stargazerCount: 7 }),
      repoNode('starred', { stargazerCount: 5 }),
      repoNode('unstarred', { stargazerCount: 0 }),
    ];

    const { featured } = selectRepos('barnuri', starred, []);

    expect(featured.map((repo) => repo.name)).toEqual(['starred']);
  });

  test('removes featured repos from the recent list', () => {
    const { recent } = selectRepos('barnuri', [repoNode('popular', { stargazerCount: 3 })], [repoNode('popular'), repoNode('fresh')]);

    expect(recent.map((repo) => repo.name)).toEqual(['fresh']);
  });

  test('caps featured and recent lists at six', () => {
    const starred = Array.from({ length: 10 }, (_, index) => repoNode(`repo-${index}`, { stargazerCount: 10 - index }));
    const recentNodes = Array.from({ length: 10 }, (_, index) => repoNode(`recent-${index}`));

    const { featured, recent } = selectRepos('barnuri', starred, recentNodes);

    expect(featured).toHaveLength(6);
    expect(recent).toHaveLength(6);
  });
});

describe('toContributions', () => {
  test('gives level 0 to empty days and spreads active days across levels 1 to 4', () => {
    const counts = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const calendar = {
      totalContributions: 36,
      weeks: [{ contributionDays: counts.map((count, index) => ({ date: `2026-01-0${index + 1}`, contributionCount: count })) }],
    };

    const { total, weeks } = toContributions(calendar);

    expect(total).toBe(36);
    expect(weeks[0]?.map((day) => day.level)).toEqual([0, 1, 1, 1, 2, 2, 3, 3, 4]);
  });

  test('handles a year with no contributions', () => {
    const calendar = { totalContributions: 0, weeks: [{ contributionDays: [{ date: '2026-01-01', contributionCount: 0 }] }] };

    expect(toContributions(calendar).weeks[0]?.[0]?.level).toBe(0);
  });
});
