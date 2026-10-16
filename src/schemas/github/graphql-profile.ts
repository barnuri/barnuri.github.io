import { z } from 'zod';

export const repoNodeSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  url: z.url(),
  stargazerCount: z.number().int(),
  isFork: z.boolean(),
  isArchived: z.boolean(),
  pushedAt: z.string(),
  primaryLanguage: z.object({ name: z.string(), color: z.string().nullable() }).nullable(),
});

export const contributionCalendarSchema = z.object({
  totalContributions: z.number().int(),
  weeks: z.array(
    z.object({
      contributionDays: z.array(z.object({ date: z.string(), contributionCount: z.number().int() })),
    }),
  ),
});

export const graphqlProfileSchema = z.object({
  starred: z.object({ nodes: z.array(repoNodeSchema) }),
  recent: z.object({ nodes: z.array(repoNodeSchema) }),
  contributionsCollection: z.object({ contributionCalendar: contributionCalendarSchema }),
});

export type RepoNode = z.infer<typeof repoNodeSchema>;
export type ContributionCalendar = z.infer<typeof contributionCalendarSchema>;
export type GraphqlProfile = z.infer<typeof graphqlProfileSchema>;
