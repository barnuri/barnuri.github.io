import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';
import { nodesOf } from './graphql/nodes-of.ts';
import { OwnedRepos } from './graphql/owned-repos.ts';
import { ProfileContributions } from './graphql/profile-contributions.ts';
import { RepoNode } from './graphql/repo-node.ts';

@ZodObject({ description: 'The profile query result for one user.' })
export class GraphqlProfile extends ZodDto {
  @ZodField(nodesOf(RepoNode))
  starred!: { nodes: RepoNode[] };

  @ZodField(nodesOf(RepoNode))
  recent!: { nodes: RepoNode[] };

  @ZodField(ProfileContributions)
  contributionsCollection!: ProfileContributions;

  @ZodField(OwnedRepos, { description: 'Public, non-fork repositories with their languages, for totals.' })
  owned!: OwnedRepos;

  @ZodField(z.object({ totalCount: z.number().int() }))
  followers!: { totalCount: number };
}
