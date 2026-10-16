import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';
import { ActivityRepository } from './activity-repository.ts';

@ZodObject()
export class RepositoryContribution extends ZodDto {
  @ZodField(z.string())
  occurredAt!: string;

  @ZodField(ActivityRepository)
  repository!: ActivityRepository;
}
