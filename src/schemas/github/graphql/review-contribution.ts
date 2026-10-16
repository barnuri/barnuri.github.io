import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';
import { ActivityPullRequest } from './activity-pull-request.ts';
import { ReviewReference } from './review-reference.ts';

@ZodObject()
export class ReviewContribution extends ZodDto {
  @ZodField(z.string())
  occurredAt!: string;

  @ZodField(ReviewReference)
  pullRequestReview!: ReviewReference;

  @ZodField(ActivityPullRequest)
  pullRequest!: ActivityPullRequest;
}
