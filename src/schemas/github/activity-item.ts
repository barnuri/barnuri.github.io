import { z } from 'zod';

export const ACTIVITY_KINDS = ['commits', 'repository', 'pull_request', 'issue', 'review'] as const;
export const ACTIVITY_STATES = ['OPEN', 'MERGED', 'CLOSED'] as const;

export const activityItemSchema = z.object({
  id: z.string(),
  kind: z.enum(ACTIVITY_KINDS),
  occurredAt: z.string(),
  repo: z.object({ name: z.string(), url: z.url() }),
  title: z.string().nullable(),
  url: z.url(),
  count: z.number().int().positive().nullable(),
  state: z.enum(ACTIVITY_STATES).nullable(),
});

export type ActivityKind = (typeof ACTIVITY_KINDS)[number];
export type ActivityState = (typeof ACTIVITY_STATES)[number];
export type ActivityItem = z.infer<typeof activityItemSchema>;
