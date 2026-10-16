import { beforeEach, describe, expect, test } from 'bun:test';
import { LinkedInSettings } from '../../../src/configs/linkedin-settings.ts';
import { AuthenticationError } from '../../../src/errors/authentication-error.ts';
import { LinkedInApiError } from '../../../src/errors/linkedin-api-error.ts';
import { MissingPermissionError } from '../../../src/errors/missing-permission-error.ts';
import { LinkedInClient } from '../../../src/services/linkedin/linkedin-client.ts';

const POSTS_URL = 'https://api.linkedin.com/rest/posts?q=author';
const TOKEN = 'test-token';
const FULL_ENV = {
  LINKEDIN_ACCESS_TOKEN: TOKEN,
  LINKEDIN_CLIENT_ID: 'client',
  LINKEDIN_CLIENT_SECRET: 'secret',
  LINKEDIN_API_VERSION: '202609',
};

const json = (status: number, body: unknown, headers: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), { status, headers });

describe('LinkedInClient', () => {
  let requests: { url: string; init: RequestInit }[];
  let sleeps: number[];

  beforeEach(() => {
    requests = [];
    sleeps = [];
  });

  const clientWith = (responses: Response[], environment: Record<string, string> = FULL_ENV): LinkedInClient =>
    new LinkedInClient(
      LinkedInSettings.fromEnv(environment),
      async (url, init) => {
        requests.push({ url, init });
        const response = responses.shift();
        if (!response) {
          throw new Error('No more fake responses.');
        }
        return response;
      },
      async (milliseconds) => {
        sleeps.push(milliseconds);
      },
    );

  test('rejects construction without a token', () => {
    expect(() => new LinkedInClient(LinkedInSettings.fromEnv({}))).toThrow(AuthenticationError);
  });

  test('sends versioned Rest.li headers', async () => {
    const client = clientWith([json(200, { elements: [] })]);

    const body = await client.getJson(POSTS_URL, 'FINDER');

    expect(body).toEqual({ elements: [] });
    expect(requests[0]?.init.headers).toEqual({
      Authorization: `Bearer ${TOKEN}`,
      'Linkedin-Version': '202609',
      'X-Restli-Protocol-Version': '2.0.0',
      'X-RestLi-Method': 'FINDER',
    });
  });

  test('returns an empty object for an empty body', async () => {
    const client = clientWith([new Response(null, { status: 200 })]);

    expect(await client.getJson(POSTS_URL)).toEqual({});
  });

  test('waits for Retry-After on 429 and then succeeds', async () => {
    const client = clientWith([json(429, {}, { 'Retry-After': '7' }), json(200, {})]);

    await client.getJson(POSTS_URL);

    expect(sleeps).toEqual([7000]);
    expect(requests).toHaveLength(2);
  });

  test('gives up after the retry limit on server errors', async () => {
    const client = clientWith(Array.from({ length: 5 }, () => json(503, { message: 'down' })));

    const error = await client.getJson(POSTS_URL).catch((err: unknown) => err);

    expect(error).toBeInstanceOf(LinkedInApiError);
    expect((error as LinkedInApiError).statusCode).toBe(503);
    expect(sleeps).toHaveLength(4);
  });

  test('maps 403 to MissingPermissionError with the API message', async () => {
    const client = clientWith([json(403, { message: 'Not enough permissions' })]);

    await expect(client.getJson(POSTS_URL)).rejects.toThrow(MissingPermissionError);
  });

  test('maps 401 to AuthenticationError', async () => {
    const client = clientWith([json(401, { message: 'Invalid access token' })]);

    await expect(client.getJson(POSTS_URL)).rejects.toThrow(AuthenticationError);
  });

  test('keeps the token out of error messages', async () => {
    const client = clientWith([new Response('bad request', { status: 400 })]);

    const error = (await client.getJson(POSTS_URL).catch((err: unknown) => err)) as Error;

    expect(error.message).not.toContain(TOKEN);
  });

  test('parses introspection scopes', async () => {
    const client = clientWith([json(200, { active: true, status: 'active', scope: 'openid,profile,r_member_social' })]);

    const token = await client.introspectToken();

    expect(token.active).toBe(true);
    expect(token.scopes).toEqual(['openid', 'profile', 'r_member_social']);
  });

  test('needs client credentials to introspect', async () => {
    const client = clientWith([], { LINKEDIN_ACCESS_TOKEN: TOKEN });

    await expect(client.introspectToken()).rejects.toThrow(AuthenticationError);
  });
});
