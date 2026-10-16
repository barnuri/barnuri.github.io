import { describe, expect, test } from 'bun:test';
import { AuthenticationError } from '../../../src/errors/authentication-error.ts';
import { MissingPermissionError } from '../../../src/errors/missing-permission-error.ts';
import type { TokenInfo } from '../../../src/schemas/linkedin/token-info.ts';
import type { JsonObject } from '../../../src/services/linkedin/linkedin-client.ts';
import { PostFetcher } from '../../../src/services/linkedin/post-fetcher.ts';

const FETCHED_AT = new Date('2026-10-16T00:00:00Z');
const MEMBER_URN = 'urn:li:person:abc123';
const FULL_SCOPE: TokenInfo = { active: true, status: 'active', scopes: ['r_member_social'], expiresAt: null };

const post = (index: number): JsonObject => ({
  id: `urn:li:share:${index}`,
  commentary: `post ${index}`,
  publishedAt: 1634817394721 + index,
});

type FakeReply = JsonObject | Error;

class FakeApi {
  readonly urls: string[] = [];

  constructor(
    private readonly replies: FakeReply[],
    private readonly token: TokenInfo = FULL_SCOPE,
  ) {}

  async getJson(url: string): Promise<JsonObject> {
    this.urls.push(url);
    const reply = this.replies.shift();
    if (!reply) {
      throw new Error(`Unexpected request to ${url}`);
    }
    if (reply instanceof Error) {
      throw reply;
    }
    return reply;
  }

  async introspectToken(): Promise<TokenInfo> {
    return this.token;
  }
}

const fetcherFor = (api: FakeApi, canIntrospect = true): PostFetcher => new PostFetcher(api, canIntrospect, () => FETCHED_AT);

describe('PostFetcher.checkReadPermission', () => {
  test('fails when the token lacks r_member_social', async () => {
    const api = new FakeApi([], { ...FULL_SCOPE, scopes: ['openid', 'w_member_social'] });

    await expect(fetcherFor(api).checkReadPermission()).rejects.toThrow(MissingPermissionError);
  });

  test('fails when the token is not active', async () => {
    const api = new FakeApi([], { ...FULL_SCOPE, active: false, status: 'expired' });

    await expect(fetcherFor(api).checkReadPermission()).rejects.toThrow(AuthenticationError);
  });

  test('skips the check without client credentials', async () => {
    const api = new FakeApi([], { ...FULL_SCOPE, scopes: [] });

    await expect(fetcherFor(api, false).checkReadPermission()).resolves.toBeUndefined();
  });
});

describe('PostFetcher.resolveMemberUrn', () => {
  test('falls back to /v2/me when /v2/userinfo is forbidden', async () => {
    const api = new FakeApi([new MissingPermissionError('no openid', 403), { id: 'abc123' }]);

    expect(await fetcherFor(api).resolveMemberUrn()).toBe(MEMBER_URN);
  });
});

describe('PostFetcher.fetchRawPosts', () => {
  test('follows pagination until a short page', async () => {
    const firstPage = { elements: Array.from({ length: 100 }, (_, index) => post(index)), paging: { links: [] } };
    const api = new FakeApi([firstPage, { elements: [post(100)], paging: { links: [] } }]);

    const posts = await fetcherFor(api).fetchRawPosts(MEMBER_URN);

    expect(posts).toHaveLength(101);
    expect(api.urls[1]).toContain('start=100');
    expect(api.urls[1]).toContain('author=urn%3Ali%3Aperson%3Aabc123');
  });

  test('keeps paging after a short page that has a next link', async () => {
    const api = new FakeApi([{ elements: [post(1)], paging: { links: [{ rel: 'next' }] } }, { elements: [] }]);

    const posts = await fetcherFor(api).fetchRawPosts(MEMBER_URN);

    expect(posts).toHaveLength(1);
    expect(api.urls).toHaveLength(2);
  });
});

describe('PostFetcher.fetch', () => {
  test('returns posts with engagement when all reads are allowed', async () => {
    const api = new FakeApi([
      { sub: 'abc123' },
      { elements: [post(1)], paging: { links: [] } },
      { likesSummary: { totalLikes: 4 }, commentsSummary: { aggregatedTotalComments: 1 } },
    ]);

    const collection = await fetcherFor(api).fetch();

    expect(collection.source).toBe('api');
    expect(collection.author_urn).toBe(MEMBER_URN);
    expect(collection.fetched_at).toBe(FETCHED_AT.toISOString());
    expect(collection.posts[0]?.engagement.likes).toBe(4);
    expect(collection.unavailable_fields).toEqual(['engagement.shares']);
  });

  test('marks engagement unavailable when social actions are forbidden', async () => {
    const api = new FakeApi([
      { sub: 'abc123' },
      { elements: [post(1)], paging: { links: [] } },
      new MissingPermissionError('no social actions', 403),
    ]);

    const collection = await fetcherFor(api).fetch();

    expect(collection.unavailable_fields).toEqual(['engagement.likes', 'engagement.comments', 'engagement.shares']);
    expect(collection.posts[0]?.engagement.likes).toBeNull();
  });
});
