import { z } from 'zod';
import { engagementSchema } from './engagement.ts';
import { mediaItemSchema } from './media-item.ts';

export const linkedInPostSchema = z.object({
  id: z.string(),
  text: z.string(),
  published_at: z.iso.datetime().nullable(),
  url: z.url(),
  visibility: z.string().nullable().default(null),
  media: z.array(mediaItemSchema).default([]),
  engagement: engagementSchema,
});

export type LinkedInPost = z.infer<typeof linkedInPostSchema>;
