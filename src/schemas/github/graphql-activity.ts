import { z } from 'zod';

const repositorySchema = z.object({
  nameWithOwner: z.string(),
  url: z.url(),
  isPrivate: z.boolean(),
});

const pullRequestSchema = z.object({
  title: z.string(),
  url: z.url(),
  state: z.enum(['OPEN', 'MERGED', 'CLOSED']),
  repository: repositorySchema,
});

const issueSchema = z.object({
  title: z.string(),
  url: z.url(),
  state: z.enum(['OPEN', 'CLOSED']),
  repository: repositorySchema,
});

const nodes = <T extends z.ZodType>(node: T) => z.object({ nodes: z.array(node) });

export const graphqlActivitySchema = z.object({
  restrictedContributionsCount: z.number().int(),
  commitContributionsByRepository: z.array(
    z.object({
      repository: repositorySchema,
      contributions: nodes(z.object({ occurredAt: z.string(), commitCount: z.number().int() })),
    }),
  ),
  repositoryContributions: nodes(z.object({ occurredAt: z.string(), repository: repositorySchema })),
  pullRequestContributions: nodes(z.object({ occurredAt: z.string(), pullRequest: pullRequestSchema })),
  issueContributions: nodes(z.object({ occurredAt: z.string(), issue: issueSchema })),
  pullRequestReviewContributions: nodes(
    z.object({ occurredAt: z.string(), pullRequestReview: z.object({ url: z.url() }), pullRequest: pullRequestSchema }),
  ),
});

export type GraphqlActivity = z.infer<typeof graphqlActivitySchema>;
