import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';
import { MonthYear } from './month-year.ts';

@ZodObject({ description: 'One role from Positions.csv.' })
export class Position extends ZodDto {
  @ZodField(z.string())
  company!: string;

  @ZodField(z.string())
  title!: string;

  @ZodField(z.string())
  description!: string;

  @ZodField(z.string().nullable())
  location!: string | null;

  @ZodField(MonthYear.schema.nullable())
  startedOn!: MonthYear | null;

  @ZodField(MonthYear.schema.nullable(), { description: 'Null for the current role.' })
  finishedOn!: MonthYear | null;
}
