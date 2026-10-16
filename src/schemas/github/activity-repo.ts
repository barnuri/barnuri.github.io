import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';

@ZodObject({ description: 'The repository an activity happened in.' })
export class ActivityRepo extends ZodDto {
  @ZodField(z.string(), { description: 'owner/name.' })
  name!: string;

  @ZodField(z.url())
  url!: string;
}
