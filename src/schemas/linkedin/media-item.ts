import { z } from 'zod';

export const mediaItemSchema = z.object({
  kind: z.string(),
  urn: z.string().nullable().default(null),
  url: z.string().nullable().default(null),
  title: z.string().nullable().default(null),
});

export type MediaItem = z.infer<typeof mediaItemSchema>;
