import { ACTIVITY_STORE_LIMIT } from '../../consts/github.ts';
import type { Activity } from '../../schemas/github/activity.ts';
import type { ActivityItem } from '../../schemas/github/activity-item.ts';
import type { GraphqlActivity } from '../../schemas/github/graphql-activity.ts';

type Repository = GraphqlActivity['repositoryContributions']['nodes'][number]['repository'];

const toRepo = (repository: Repository): ActivityItem['repo'] => ({ name: repository.nameWithOwner, url: repository.url });

const byNewest = (a: ActivityItem, b: ActivityItem): number => b.occurredAt.localeCompare(a.occurredAt);

export function toActivityItems(collection: GraphqlActivity): ActivityItem[] {
  const commits = collection.commitContributionsByRepository
    .filter(({ repository }) => !repository.isPrivate)
    .flatMap(({ repository, contributions }) =>
      contributions.nodes.map(
        (day): ActivityItem => ({
          id: `commits:${repository.nameWithOwner}:${day.occurredAt.slice(0, 10)}`,
          kind: 'commits',
          occurredAt: day.occurredAt,
          repo: toRepo(repository),
          title: null,
          url: `${repository.url}/commits`,
          count: day.commitCount,
          state: null,
        }),
      ),
    );

  const repositories = collection.repositoryContributions.nodes
    .filter(({ repository }) => !repository.isPrivate)
    .map(
      ({ occurredAt, repository }): ActivityItem => ({
        id: `repository:${repository.nameWithOwner}`,
        kind: 'repository',
        occurredAt,
        repo: toRepo(repository),
        title: null,
        url: repository.url,
        count: null,
        state: null,
      }),
    );

  const pullRequests = collection.pullRequestContributions.nodes
    .filter(({ pullRequest }) => !pullRequest.repository.isPrivate)
    .map(
      ({ occurredAt, pullRequest }): ActivityItem => ({
        id: `pull_request:${pullRequest.url}`,
        kind: 'pull_request',
        occurredAt,
        repo: toRepo(pullRequest.repository),
        title: pullRequest.title,
        url: pullRequest.url,
        count: null,
        state: pullRequest.state,
      }),
    );

  const issues = collection.issueContributions.nodes
    .filter(({ issue }) => !issue.repository.isPrivate)
    .map(
      ({ occurredAt, issue }): ActivityItem => ({
        id: `issue:${issue.url}`,
        kind: 'issue',
        occurredAt,
        repo: toRepo(issue.repository),
        title: issue.title,
        url: issue.url,
        count: null,
        state: issue.state,
      }),
    );

  const reviews = collection.pullRequestReviewContributions.nodes
    .filter(({ pullRequest }) => !pullRequest.repository.isPrivate)
    .map(
      ({ occurredAt, pullRequest, pullRequestReview }): ActivityItem => ({
        id: `review:${pullRequestReview.url}`,
        kind: 'review',
        occurredAt,
        repo: toRepo(pullRequest.repository),
        title: pullRequest.title,
        url: pullRequestReview.url,
        count: null,
        state: null,
      }),
    );

  return [...commits, ...repositories, ...pullRequests, ...issues, ...reviews].toSorted(byNewest);
}

export function mergeActivity(saved: Activity | null, fresh: Activity, limit: number = ACTIVITY_STORE_LIMIT): Activity {
  const byId = new Map((saved?.items ?? []).map((item) => [item.id, item]));
  for (const item of fresh.items) {
    byId.set(item.id, item);
  }
  return {
    items: [...byId.values()].toSorted(byNewest).slice(0, limit),
    privateContributions: fresh.privateContributions,
  };
}
