import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';

@ZodObject({ description: 'One day in the contribution graph.' })
export class ContributionDay extends ZodDto {
  @ZodField(z.string())
  date!: string;

  @ZodField(z.number().int().nonnegative())
  count!: number;

  @ZodField(z.number().int().min(0).max(4), { description: 'Color level, 0 for no contributions up to 4.' })
  level!: number;
}
