import { z } from 'zod';

export const engagementSchema = z.object({
  likes: z.number().int().nullable().default(null),
  comments: z.number().int().nullable().default(null),
  shares: z.number().int().nullable().default(null),
});

export type Engagement = z.infer<typeof engagementSchema>;

export const UNKNOWN_ENGAGEMENT: Engagement = { likes: null, comments: null, shares: null };
