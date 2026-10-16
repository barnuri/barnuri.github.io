import { z } from 'zod';
import { type GraphqlProfile, graphqlProfileSchema } from '../../schemas/github/graphql-profile.ts';

type Fetch = (input: string, init: RequestInit) => Promise<Response>;

export class GitHubClient {
  static readonly GRAPHQL_URL = 'https://api.github.com/graphql';
  static readonly REPO_FIELDS = 'name description url stargazerCount isFork isArchived pushedAt primaryLanguage { name color }';
  static readonly PROFILE_QUERY = `query($login: String!) {
  user(login: $login) {
    starred: repositories(first: 20, ownerAffiliations: OWNER, privacy: PUBLIC, isFork: false, orderBy: { field: STARGAZERS, direction: DESC }) { nodes { ${GitHubClient.REPO_FIELDS} } }
    recent: repositories(first: 20, ownerAffiliations: OWNER, privacy: PUBLIC, isFork: false, orderBy: { field: PUSHED_AT, direction: DESC }) { nodes { ${GitHubClient.REPO_FIELDS} } }
    contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } } }
  }
}`;
  static readonly RESPONSE_SCHEMA = z.object({
    data: z.object({ user: graphqlProfileSchema.nullable() }).optional(),
    errors: z.array(z.object({ message: z.string() })).optional(),
  });

  constructor(
    private readonly token: string,
    private readonly fetchImpl: Fetch = fetch,
  ) {}

  async fetchProfile(login: string): Promise<GraphqlProfile> {
    const response = await this.fetchImpl(GitHubClient.GRAPHQL_URL, {
      method: 'POST',
      headers: { Authorization: `bearer ${this.token}`, 'Content-Type': 'application/json', 'User-Agent': `${login}-pages-data` },
      body: JSON.stringify({ query: GitHubClient.PROFILE_QUERY, variables: { login } }),
    });
    if (!response.ok) {
      throw new Error(`GitHub GraphQL request failed with status ${response.status}.`);
    }
    const body = GitHubClient.RESPONSE_SCHEMA.parse(await response.json());
    if (body.errors?.length) {
      throw new Error(`GitHub GraphQL returned errors: ${body.errors.map((error) => error.message).join('; ')}`);
    }
    if (!body.data?.user) {
      throw new Error(`GitHub user ${login} was not found.`);
    }
    return body.data.user;
  }
}
