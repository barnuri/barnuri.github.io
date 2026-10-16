import { z } from 'zod';

export const contributionDaySchema = z.object({
  date: z.string(),
  count: z.number().int().nonnegative(),
  level: z.number().int().min(0).max(4),
});

export const contributionsSchema = z.object({
  total: z.number().int().nonnegative(),
  weeks: z.array(z.array(contributionDaySchema)),
});

export type ContributionDay = z.infer<typeof contributionDaySchema>;
export type Contributions = z.infer<typeof contributionsSchema>;
