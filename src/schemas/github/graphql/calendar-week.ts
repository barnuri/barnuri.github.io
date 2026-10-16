import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { CalendarDay } from './calendar-day.ts';

@ZodObject()
export class CalendarWeek extends ZodDto {
  @ZodField([CalendarDay])
  contributionDays!: CalendarDay[];
}
