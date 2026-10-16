import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';
import { CommitsByRepository } from './graphql/commits-by-repository.ts';
import { IssueContribution } from './graphql/issue-contribution.ts';
import { nodesOf } from './graphql/nodes-of.ts';
import { PullRequestContribution } from './graphql/pull-request-contribution.ts';
import { RepositoryContribution } from './graphql/repository-contribution.ts';
import { ReviewContribution } from './graphql/review-contribution.ts';

@ZodObject({ description: 'The activity query result for one user and time window.' })
export class GraphqlActivity extends ZodDto {
  @ZodField(z.number().int(), { description: 'Contributions in private repositories, count only.' })
  restrictedContributionsCount!: number;

  @ZodField([CommitsByRepository])
  commitContributionsByRepository!: CommitsByRepository[];

  @ZodField(nodesOf(RepositoryContribution))
  repositoryContributions!: { nodes: RepositoryContribution[] };

  @ZodField(nodesOf(PullRequestContribution))
  pullRequestContributions!: { nodes: PullRequestContribution[] };

  @ZodField(nodesOf(IssueContribution))
  issueContributions!: { nodes: IssueContribution[] };

  @ZodField(nodesOf(ReviewContribution))
  pullRequestReviewContributions!: { nodes: ReviewContribution[] };
}
