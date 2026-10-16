import { z } from 'zod';
import { monthYearSchema } from './month-year.ts';

export const educationSchema = z.object({
  school: z.string(),
  degree: z.string().nullable(),
  notes: z.string().nullable(),
  startedOn: monthYearSchema.nullable(),
  finishedOn: monthYearSchema.nullable(),
});

export type Education = z.infer<typeof educationSchema>;
