import { z } from 'zod';
import { activityItemSchema } from './activity-item.ts';

export const activitySchema = z.object({
  items: z.array(activityItemSchema),
  privateContributions: z.number().int().nonnegative(),
});

export type Activity = z.infer<typeof activitySchema>;

export const EMPTY_ACTIVITY: Activity = { items: [], privateContributions: 0 };
