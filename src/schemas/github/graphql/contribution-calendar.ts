import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';
import { CalendarWeek } from './calendar-week.ts';

@ZodObject()
export class ContributionCalendar extends ZodDto {
  @ZodField(z.number().int())
  totalContributions!: number;

  @ZodField([CalendarWeek])
  weeks!: CalendarWeek[];
}
