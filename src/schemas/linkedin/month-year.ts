import { z } from 'zod';

export const monthYearSchema = z.object({
  year: z.number().int().min(1900).max(2200),
  month: z.number().int().min(1).max(12).nullable(),
});

export type MonthYear = z.infer<typeof monthYearSchema>;
