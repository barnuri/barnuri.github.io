import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';
import { ContributionDay } from './contribution-day.ts';

@ZodObject({ description: 'The contribution graph for the last year.' })
export class Contributions extends ZodDto {
  @ZodField(z.number().int().nonnegative())
  total!: number;

  @ZodField(z.array(z.array(ContributionDay.schema)), { description: 'Weeks, each a list of days.' })
  weeks!: ContributionDay[][];
}
