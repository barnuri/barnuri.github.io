import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';

@ZodObject()
export class CommitDay extends ZodDto {
  @ZodField(z.string())
  occurredAt!: string;

  @ZodField(z.number().int())
  commitCount!: number;
}
