import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';
import { MonthYear } from './month-year.ts';

@ZodObject({ description: 'One school from Education.csv.' })
export class Education extends ZodDto {
  @ZodField(z.string())
  school!: string;

  @ZodField(z.string().nullable())
  degree!: string | null;

  @ZodField(z.string().nullable())
  notes!: string | null;

  @ZodField(MonthYear.schema.nullable())
  startedOn!: MonthYear | null;

  @ZodField(MonthYear.schema.nullable())
  finishedOn!: MonthYear | null;
}
