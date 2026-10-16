import { z } from 'zod';

export const repoSchema = z.object({
  name: z.string(),
  description: z.string(),
  url: z.url(),
  stars: z.number().int().nonnegative(),
  language: z.string().nullable(),
  languageColor: z.string().nullable(),
  pushedAt: z.string(),
});

export type Repo = z.infer<typeof repoSchema>;
