import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { ActivityRepository } from './activity-repository.ts';
import { CommitDay } from './commit-day.ts';
import { nodesOf } from './nodes-of.ts';

@ZodObject()
export class CommitsByRepository extends ZodDto {
  @ZodField(ActivityRepository)
  repository!: ActivityRepository;

  @ZodField(nodesOf(CommitDay))
  contributions!: { nodes: CommitDay[] };
}
