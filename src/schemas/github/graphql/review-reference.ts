import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';

@ZodObject()
export class ReviewReference extends ZodDto {
  @ZodField(z.url())
  url!: string;
}
