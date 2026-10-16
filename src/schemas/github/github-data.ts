import { z } from 'zod';
import { contributionsSchema } from './contributions.ts';
import { repoSchema } from './repo.ts';

export const githubDataSchema = z.object({
  featured: z.array(repoSchema),
  recent: z.array(repoSchema),
  contributions: contributionsSchema,
});

export type GitHubData = z.infer<typeof githubDataSchema>;
