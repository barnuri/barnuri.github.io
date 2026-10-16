import { z } from 'zod';
import { monthYearSchema } from './month-year.ts';

export const positionSchema = z.object({
  company: z.string(),
  title: z.string(),
  description: z.string(),
  location: z.string().nullable(),
  startedOn: monthYearSchema.nullable(),
  finishedOn: monthYearSchema.nullable(),
});

export type Position = z.infer<typeof positionSchema>;
