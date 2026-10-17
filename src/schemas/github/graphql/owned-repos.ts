import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';
import { OwnedRepo } from './owned-repo.ts';

@ZodObject()
export class OwnedRepos extends ZodDto {
  @ZodField(z.number().int())
  totalCount!: number;

  @ZodField([OwnedRepo])
  nodes!: OwnedRepo[];
}
