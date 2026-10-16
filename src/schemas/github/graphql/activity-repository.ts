import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';

@ZodObject()
export class ActivityRepository extends ZodDto {
  @ZodField(z.string())
  nameWithOwner!: string;

  @ZodField(z.url())
  url!: string;

  @ZodField(z.boolean())
  isPrivate!: boolean;
}
