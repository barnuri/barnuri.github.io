import { describe, expect, test } from 'bun:test';
import type { Activity } from '../../../src/schemas/github/activity.ts';
import type { ActivityItem } from '../../../src/schemas/github/activity-item.ts';
import type { GraphqlActivity } from '../../../src/schemas/github/graphql-activity.ts';
import { mergeActivity, toActivityItems } from '../../../src/services/github/activity-data.ts';

const repository = (name: string, isPrivate = false) => ({ nameWithOwner: name, url: `https://github.com/${name}`, isPrivate });

const collection = (overrides: Partial<GraphqlActivity> = {}): GraphqlActivity => ({
  restrictedContributionsCount: 0,
  commitContributionsByRepository: [],
  repositoryContributions: { nodes: [] },
  pullRequestContributions: { nodes: [] },
  issueContributions: { nodes: [] },
  pullRequestReviewContributions: { nodes: [] },
  ...overrides,
});

const item = (id: string, occurredAt: string): ActivityItem => ({
  id,
  kind: 'repository',
  occurredAt,
  repo: { name: 'barnuri/x', url: 'https://github.com/barnuri/x' },
  title: null,
  url: 'https://github.com/barnuri/x',
  count: null,
  state: null,
});

describe('toActivityItems', () => {
  test('maps every contribution type and sorts newest first', () => {
    const items = toActivityItems(
      collection({
        commitContributionsByRepository: [
          {
            repository: repository('barnuri/ghx'),
            contributions: { nodes: [{ occurredAt: '2026-10-16T07:00:00Z', commitCount: 3 }] },
          },
        ],
        repositoryContributions: { nodes: [{ occurredAt: '2026-10-15T17:00:00Z', repository: repository('barnuri/ghx') }] },
        pullRequestContributions: {
          nodes: [
            {
              occurredAt: '2026-10-05T08:00:00Z',
              pullRequest: { title: 'fix tests', url: 'https://github.com/o/r/pull/1', state: 'MERGED', repository: repository('o/r') },
            },
          ],
        },
        issueContributions: {
          nodes: [
            {
              occurredAt: '2026-10-04T08:00:00Z',
              issue: { title: 'bug', url: 'https://github.com/o/r/issues/2', state: 'OPEN', repository: repository('o/r') },
            },
          ],
        },
        pullRequestReviewContributions: {
          nodes: [
            {
              occurredAt: '2026-10-03T08:00:00Z',
              pullRequestReview: { url: 'https://github.com/o/r/pull/3#review-1' },
              pullRequest: { title: 'feature', url: 'https://github.com/o/r/pull/3', state: 'OPEN', repository: repository('o/r') },
            },
          ],
        },
      }),
    );

    expect(items.map((activity) => activity.kind)).toEqual(['commits', 'repository', 'pull_request', 'issue', 'review']);
    expect(items[0]).toMatchObject({ id: 'commits:barnuri/ghx:2026-10-16', count: 3, url: 'https://github.com/barnuri/ghx/commits' });
    expect(items[2]).toMatchObject({ title: 'fix tests', state: 'MERGED' });
    expect(items[4]).toMatchObject({ url: 'https://github.com/o/r/pull/3#review-1', state: null });
  });

  test('leaves out private repositories', () => {
    const items = toActivityItems(
      collection({
        commitContributionsByRepository: [
          {
            repository: repository('barnuri/secret', true),
            contributions: { nodes: [{ occurredAt: '2026-10-16T07:00:00Z', commitCount: 9 }] },
          },
        ],
        repositoryContributions: { nodes: [{ occurredAt: '2026-10-15T17:00:00Z', repository: repository('barnuri/secret', true) }] },
      }),
    );

    expect(items).toEqual([]);
  });
});

describe('mergeActivity', () => {
  const saved: Activity = {
    items: [item('a', '2026-01-01T00:00:00Z'), item('b', '2026-02-01T00:00:00Z')],
    privateContributions: 10,
  };

  test('keeps saved history, prefers fresh items with the same id, and sorts newest first', () => {
    const fresh: Activity = { items: [{ ...item('b', '2026-02-01T00:00:00Z'), count: 5 }, item('c', '2026-03-01T00:00:00Z')], privateContributions: 20 };

    const merged = mergeActivity(saved, fresh);

    expect(merged.items.map((activity) => activity.id)).toEqual(['c', 'b', 'a']);
    expect(merged.items[1]?.count).toBe(5);
    expect(merged.privateContributions).toBe(20);
  });

  test('caps the history at the limit, dropping the oldest', () => {
    const fresh: Activity = { items: [item('c', '2026-03-01T00:00:00Z')], privateContributions: 0 };

    expect(mergeActivity(saved, fresh, 2).items.map((activity) => activity.id)).toEqual(['c', 'b']);
  });

  test('starts from the fresh items without saved data', () => {
    const fresh: Activity = { items: [item('c', '2026-03-01T00:00:00Z')], privateContributions: 1 };

    expect(mergeActivity(null, fresh)).toEqual(fresh);
  });
});
