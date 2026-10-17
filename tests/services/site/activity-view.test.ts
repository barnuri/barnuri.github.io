import { describe, expect, test } from 'bun:test';
import type { ActivityItem } from '../../../src/schemas/github/activity-item.ts';
import { contributionSummary, mostActiveOwnRepos, sideOf } from '../../../src/services/site/activity-view.ts';

const item = (repo: string, overrides: Partial<ActivityItem> = {}): ActivityItem => ({
  id: `${repo}-${Math.random()}`,
  kind: 'commits',
  occurredAt: '2026-10-16T07:00:00Z',
  repo: { name: repo, url: `https://github.com/${repo}` },
  title: null,
  url: `https://github.com/${repo}`,
  count: 1,
  state: null,
  ...overrides,
});

describe('sideOf', () => {
  test('treats repos under the login as own, case-insensitively', () => {
    expect(sideOf(item('BarNuri/ghx'), 'barnuri')).toBe('own');
    expect(sideOf(item('barnuri-fork/ghx'), 'barnuri')).toBe('ext');
  });
});

describe('mostActiveOwnRepos', () => {
  test('ranks own repos by commit count and ignores other repos', () => {
    const items = [item('barnuri/a', { count: 2 }), item('barnuri/b', { count: 5 }), item('barnuri/a', { count: 4 }), item('other/c', { count: 9 })];

    expect(mostActiveOwnRepos(items, 'barnuri', 5).map((repo) => [repo.name, repo.count])).toEqual([
      ['barnuri/a', 6],
      ['barnuri/b', 5],
    ]);
  });
});

describe('contributionSummary', () => {
  test('counts pull requests by state, reviews and issues in other repos', () => {
    const items = [
      item('o/r', { kind: 'pull_request', state: 'MERGED', count: null }),
      item('o/r', { kind: 'pull_request', state: 'OPEN', count: null }),
      item('o/s', { kind: 'review', count: null }),
      item('o/s', { kind: 'issue', state: 'OPEN', count: null }),
      item('barnuri/a', { kind: 'pull_request', state: 'OPEN', count: null }),
    ];

    const summary = contributionSummary(items, 'barnuri');

    expect(summary).toMatchObject({ pullRequests: 2, merged: 1, open: 1, closed: 0, reviews: 1, issues: 1 });
    expect(summary.repos.map((repo) => [repo.name, repo.count])).toEqual([
      ['o/r', 2],
      ['o/s', 2],
    ]);
  });
});
