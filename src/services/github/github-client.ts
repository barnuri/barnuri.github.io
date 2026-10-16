import { z } from 'zod';
import { ACTIVITY_PAGE_SIZE } from '../../consts/github.ts';
import { type GraphqlActivity, graphqlActivitySchema } from '../../schemas/github/graphql-activity.ts';
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
  static readonly ACTIVITY_REPOSITORY_FIELDS = 'nameWithOwner url isPrivate';
  static readonly ACTIVITY_QUERY = `query($login: String!, $from: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from) {
      restrictedContributionsCount
      commitContributionsByRepository(maxRepositories: ${ACTIVITY_PAGE_SIZE}) {
        repository { ${GitHubClient.ACTIVITY_REPOSITORY_FIELDS} }
        contributions(first: ${ACTIVITY_PAGE_SIZE}, orderBy: { field: OCCURRED_AT, direction: DESC }) { nodes { occurredAt commitCount } }
      }
      repositoryContributions(first: ${ACTIVITY_PAGE_SIZE}, orderBy: { direction: DESC }) {
        nodes { occurredAt repository { ${GitHubClient.ACTIVITY_REPOSITORY_FIELDS} } }
      }
      pullRequestContributions(first: ${ACTIVITY_PAGE_SIZE}, orderBy: { direction: DESC }) {
        nodes { occurredAt pullRequest { title url state repository { ${GitHubClient.ACTIVITY_REPOSITORY_FIELDS} } } }
      }
      issueContributions(first: ${ACTIVITY_PAGE_SIZE}, orderBy: { direction: DESC }) {
        nodes { occurredAt issue { title url state repository { ${GitHubClient.ACTIVITY_REPOSITORY_FIELDS} } } }
      }
      pullRequestReviewContributions(first: ${ACTIVITY_PAGE_SIZE}, orderBy: { direction: DESC }) {
        nodes { occurredAt pullRequestReview { url } pullRequest { title url state repository { ${GitHubClient.ACTIVITY_REPOSITORY_FIELDS} } } }
      }
    }
  }
}`;
  static readonly ACTIVITY_RESPONSE_SCHEMA = z.object({
    data: z.object({ user: z.object({ contributionsCollection: graphqlActivitySchema }).nullable() }).optional(),
    errors: z.array(z.object({ message: z.string() })).optional(),
  });

  constructor(
    private readonly token: string,
    private readonly fetchImpl: Fetch = fetch,
  ) {}

  async fetchProfile(login: string): Promise<GraphqlProfile> {
    const body = GitHubClient.RESPONSE_SCHEMA.parse(await this.query(login, GitHubClient.PROFILE_QUERY, { login }));
    GitHubClient.throwOnErrors(body.errors);
    if (!body.data?.user) {
      throw new Error(`GitHub user ${login} was not found.`);
    }
    return body.data.user;
  }

  async fetchActivity(login: string, from: Date): Promise<GraphqlActivity> {
    const variables = { login, from: from.toISOString() };
    const body = GitHubClient.ACTIVITY_RESPONSE_SCHEMA.parse(await this.query(login, GitHubClient.ACTIVITY_QUERY, variables));
    GitHubClient.throwOnErrors(body.errors);
    if (!body.data?.user) {
      throw new Error(`GitHub user ${login} was not found.`);
    }
    return body.data.user.contributionsCollection;
  }

  private async query(login: string, query: string, variables: Record<string, string>): Promise<unknown> {
    const response = await this.fetchImpl(GitHubClient.GRAPHQL_URL, {
      method: 'POST',
      headers: { Authorization: `bearer ${this.token}`, 'Content-Type': 'application/json', 'User-Agent': `${login}-pages-data` },
      body: JSON.stringify({ query, variables }),
    });
    if (!response.ok) {
      throw new Error(`GitHub GraphQL request failed with status ${response.status}.`);
    }
    return response.json();
  }

  private static throwOnErrors(errors: readonly { message: string }[] | undefined): void {
    if (errors?.length) {
      throw new Error(`GitHub GraphQL returned errors: ${errors.map((error) => error.message).join('; ')}`);
    }
  }
}
