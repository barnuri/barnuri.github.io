import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';
import { ACTIVITY_STATES, type ActivityState } from '../../../consts/github.ts';
import { ActivityRepository } from './activity-repository.ts';

@ZodObject()
export class ActivityPullRequest extends ZodDto {
  @ZodField(z.string())
  title!: string;

  @ZodField(z.url())
  url!: string;

  @ZodField(z.enum(ACTIVITY_STATES))
  state!: ActivityState;

  @ZodField(ActivityRepository)
  repository!: ActivityRepository;
}
