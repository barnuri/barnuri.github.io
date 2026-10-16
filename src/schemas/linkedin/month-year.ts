import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';

@ZodObject({ description: 'A date with month precision, or year only.' })
export class MonthYear extends ZodDto {
  @ZodField(z.number().int().min(1900).max(2200))
  year!: number;

  @ZodField(z.number().int().min(1).max(12).nullable(), { description: 'Null when only the year is known.' })
  month!: number | null;
}
