import { API_BASE_URL, MAX_PAGES, PAGE_SIZE, READ_POSTS_SCOPE } from '../../consts/linkedin-api.ts';
import { AuthenticationError } from '../../errors/authentication-error.ts';
import { LinkedInApiError } from '../../errors/linkedin-api-error.ts';
import { MissingPermissionError } from '../../errors/missing-permission-error.ts';
import type { Engagement } from '../../schemas/linkedin/engagement.ts';
import type { PostCollection } from '../../schemas/linkedin/post-collection.ts';
import type { JsonObject, LinkedInClient } from './linkedin-client.ts';
import { normalizePost, toEngagement } from './post-normalizer.ts';

type PostApi = Pick<LinkedInClient, 'getJson' | 'introspectToken'>;

export class PostFetcher {
  static readonly ALL_ENGAGEMENT_FIELDS = ['engagement.likes', 'engagement.comments', 'engagement.shares'];

  constructor(
    private readonly client: PostApi,
    private readonly canIntrospect: boolean,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async checkReadPermission(): Promise<void> {
    if (!this.canIntrospect) {
      console.info('Client credentials are not set. Skipping the scope check; the Posts API will decide.');
      return;
    }
    const token = await this.client.introspectToken();
    if (!token.active) {
      throw new AuthenticationError(`The LinkedIn access token is not active (status: ${token.status ?? 'unknown'}).`);
    }
    if (!token.scopes.includes(READ_POSTS_SCOPE)) {
      const granted = token.scopes.join(', ') || 'none';
      throw new MissingPermissionError(`The token does not have ${READ_POSTS_SCOPE}. Granted scopes: ${granted}.`);
    }
    if (token.expiresAt) {
      console.info(`Token has ${READ_POSTS_SCOPE} and expires ${token.expiresAt.toISOString().slice(0, 10)}.`);
    }
  }

  async resolveMemberUrn(): Promise<string> {
    let memberId: unknown;
    try {
      memberId = (await this.client.getJson(`${API_BASE_URL}/v2/userinfo`)).sub;
    } catch (err) {
      if (!(err instanceof MissingPermissionError)) {
        throw err;
      }
      memberId = (await this.client.getJson(`${API_BASE_URL}/v2/me`)).id;
    }
    if (typeof memberId !== 'string' || !memberId) {
      throw new LinkedInApiError('LinkedIn did not return a member id from /v2/userinfo or /v2/me.');
    }
    return `urn:li:person:${memberId}`;
  }

  async fetchRawPosts(authorUrn: string): Promise<JsonObject[]> {
    const posts: JsonObject[] = [];
    let start = 0;
    for (let page = 0; page < MAX_PAGES; page++) {
      const url =
        `${API_BASE_URL}/rest/posts?q=author&author=${encodeURIComponent(authorUrn)}` +
        `&count=${PAGE_SIZE}&start=${start}&sortBy=CREATED`;
      const response = await this.client.getJson(url, 'FINDER');
      const elements = Array.isArray(response.elements) ? (response.elements as JsonObject[]) : [];
      posts.push(...elements);
      if (elements.length === 0 || !PostFetcher.hasNextPage(response, elements.length)) {
        return posts;
      }
      start += elements.length;
    }
    console.warn(`Stopped after ${MAX_PAGES} pages. Some older posts may be missing.`);
    return posts;
  }

  async fetchEngagement(postUrns: readonly string[]): Promise<Map<string, Engagement> | null> {
    const engagement = new Map<string, Engagement>();
    for (const urn of postUrns) {
      try {
        const socialActions = await this.client.getJson(`${API_BASE_URL}/rest/socialActions/${encodeURIComponent(urn)}`);
        engagement.set(urn, toEngagement(socialActions));
      } catch (err) {
        if (!(err instanceof MissingPermissionError)) {
          throw err;
        }
        console.warn('The token cannot read likes and comments. Engagement metrics are left out.');
        return null;
      }
    }
    return engagement;
  }

  async fetch(): Promise<PostCollection> {
    await this.checkReadPermission();
    const authorUrn = await this.resolveMemberUrn();
    const rawPosts = await this.fetchRawPosts(authorUrn);
    const engagement = await this.fetchEngagement(rawPosts.map((post) => String(post.id)));

    return {
      source: 'api',
      fetched_at: this.now().toISOString(),
      author_urn: authorUrn,
      posts: rawPosts.map((post) => normalizePost(post, engagement?.get(String(post.id)))),
      unavailable_fields: engagement ? ['engagement.shares'] : PostFetcher.ALL_ENGAGEMENT_FIELDS,
    };
  }

  private static hasNextPage(response: JsonObject, received: number): boolean {
    const paging = response.paging as { links?: { rel?: string }[] } | undefined;
    if (paging?.links?.some((link) => link.rel === 'next')) {
      return true;
    }
    return received >= PAGE_SIZE;
  }
}
