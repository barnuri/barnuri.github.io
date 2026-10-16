import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';
import { ActivityPullRequest } from './activity-pull-request.ts';

@ZodObject()
export class PullRequestContribution extends ZodDto {
  @ZodField(z.string())
  occurredAt!: string;

  @ZodField(ActivityPullRequest)
  pullRequest!: ActivityPullRequest;
}
