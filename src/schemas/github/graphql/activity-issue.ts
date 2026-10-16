import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';
import { ISSUE_STATES, type IssueState } from '../../../consts/github.ts';
import { ActivityRepository } from './activity-repository.ts';

@ZodObject()
export class ActivityIssue extends ZodDto {
  @ZodField(z.string())
  title!: string;

  @ZodField(z.url())
  url!: string;

  @ZodField(z.enum(ISSUE_STATES))
  state!: IssueState;

  @ZodField(ActivityRepository)
  repository!: ActivityRepository;
}
