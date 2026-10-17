import { describe, expect, test } from 'bun:test';
import { GitHubClient } from '../../../src/services/github/github-client.ts';

const profile = {
  starred: { nodes: [] },
  recent: { nodes: [] },
  contributionsCollection: { contributionCalendar: { totalContributions: 0, weeks: [] } },
  owned: { totalCount: 0, nodes: [] },
  followers: { totalCount: 0 },
};

const clientReturning = (status: number, body: unknown) => {
  const requests: RequestInit[] = [];
  const client = new GitHubClient('gh-token', async (_url, init) => {
    requests.push(init);
    return new Response(JSON.stringify(body), { status });
  });
  return { client, requests };
};

describe('GitHubClient.fetchProfile', () => {
  test('sends the token and returns the user profile', async () => {
    const { client, requests } = clientReturning(200, { data: { user: profile } });

    const result = await client.fetchProfile('barnuri');

    expect(result.contributionsCollection.contributionCalendar.totalContributions).toBe(0);
    expect((requests[0]?.headers as Record<string, string>).Authorization).toBe('bearer gh-token');
  });

  test('fails on a non-success status', async () => {
    const { client } = clientReturning(502, {});

    await expect(client.fetchProfile('barnuri')).rejects.toThrow('status 502');
  });

  test('fails with the GraphQL error messages', async () => {
    const { client } = clientReturning(200, { errors: [{ message: 'Bad credentials' }] });

    await expect(client.fetchProfile('barnuri')).rejects.toThrow('Bad credentials');
  });

  test('fails when the user does not exist', async () => {
    const { client } = clientReturning(200, { data: { user: null } });

    await expect(client.fetchProfile('nobody')).rejects.toThrow('nobody was not found');
  });
});
