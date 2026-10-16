import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';
import { ACTIVITY_KINDS, ACTIVITY_STATES, type ActivityKind, type ActivityState } from '../../consts/github.ts';
import { ActivityRepo } from './activity-repo.ts';

@ZodObject({ description: 'One public GitHub activity.' })
export class ActivityItem extends ZodDto {
  @ZodField(z.string(), { description: 'Stable id used to merge fetches.' })
  id!: string;

  @ZodField(z.enum(ACTIVITY_KINDS))
  kind!: ActivityKind;

  @ZodField(z.string())
  occurredAt!: string;

  @ZodField(ActivityRepo)
  repo!: ActivityRepo;

  @ZodField(z.string().nullable(), { description: 'Pull request or issue title.' })
  title!: string | null;

  @ZodField(z.url())
  url!: string;

  @ZodField(z.number().int().positive().nullable(), { description: 'Commit count for commit days.' })
  count!: number | null;

  @ZodField(z.enum(ACTIVITY_STATES).nullable())
  state!: ActivityState | null;
}
