import { z } from 'zod';
import { linkedInPostSchema } from './linkedin-post.ts';

export const POST_SOURCES = ['api', 'export'] as const;

export const postCollectionSchema = z.object({
  source: z.enum(POST_SOURCES),
  fetched_at: z.iso.datetime(),
  author_urn: z.string().nullable().default(null),
  posts: z.array(linkedInPostSchema),
  unavailable_fields: z.array(z.string()),
});

export type PostCollection = z.infer<typeof postCollectionSchema>;
