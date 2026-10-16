import { z } from 'zod';
import { activitySchema, EMPTY_ACTIVITY } from './activity.ts';
import { contributionsSchema } from './contributions.ts';
import { repoSchema } from './repo.ts';

export const githubDataSchema = z.object({
  featured: z.array(repoSchema),
  recent: z.array(repoSchema),
  contributions: contributionsSchema,
  activity: activitySchema.default(EMPTY_ACTIVITY),
});

export type GitHubData = z.infer<typeof githubDataSchema>;
