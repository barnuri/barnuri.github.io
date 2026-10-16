import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';
import { ActivityIssue } from './activity-issue.ts';

@ZodObject()
export class IssueContribution extends ZodDto {
  @ZodField(z.string())
  occurredAt!: string;

  @ZodField(ActivityIssue)
  issue!: ActivityIssue;
}
