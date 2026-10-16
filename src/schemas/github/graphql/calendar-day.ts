import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';

@ZodObject()
export class CalendarDay extends ZodDto {
  @ZodField(z.string())
  date!: string;

  @ZodField(z.number().int())
  contributionCount!: number;
}
