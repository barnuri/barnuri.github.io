import { describe, expect, test } from 'bun:test';
import { LinkedInSettings } from '../../../src/configs/linkedin-settings.ts';
import { AuthenticationError } from '../../../src/errors/authentication-error.ts';
import { OAuthHelper } from '../../../src/services/auth/oauth-helper.ts';

const settings = LinkedInSettings.fromEnv({ LINKEDIN_CLIENT_ID: 'client', LINKEDIN_CLIENT_SECRET: 'secret' });

describe('OAuthHelper', () => {
  test('requires client credentials', () => {
    expect(() => new OAuthHelper(LinkedInSettings.fromEnv({}))).toThrow(AuthenticationError);
  });

  test('builds the authorization URL with the read scope and state', () => {
    const url = new URL(new OAuthHelper(settings).authorizationUrl('https://localhost/callback', 'state-1'));

    expect(url.origin + url.pathname).toBe('https://www.linkedin.com/oauth/v2/authorization');
    expect(url.searchParams.get('scope')).toBe('openid profile r_member_social');
    expect(url.searchParams.get('state')).toBe('state-1');
    expect(url.searchParams.get('client_id')).toBe('client');
  });

  test('exchanges the code for a token', async () => {
    let sentBody = '';
    const helper = new OAuthHelper(settings, async (_url, init) => {
      sentBody = String(init.body);
      return new Response(JSON.stringify({ access_token: 'new-token', expires_in: 5_184_000 }));
    });

    const token = await helper.exchangeCode('code-1', 'https://localhost/callback');

    expect(token.access_token).toBe('new-token');
    expect(sentBody).toContain('grant_type=authorization_code');
  });

  test('fails when LinkedIn refuses the code', async () => {
    const helper = new OAuthHelper(settings, async () => new Response('{}', { status: 400 }));

    await expect(helper.exchangeCode('expired', 'https://localhost/callback')).rejects.toThrow(AuthenticationError);
  });

  test('stores the token under the LINKEDIN_ACCESS_TOKEN secret', async () => {
    const stored: string[] = [];

    await OAuthHelper.storeToken({ access_token: 'new-token', expires_in: 1 }, 'barnuri/barnuri.github.io', async (...args) => {
      stored.push(...args);
    });

    expect(stored).toEqual(['LINKEDIN_ACCESS_TOKEN', 'barnuri/barnuri.github.io', 'new-token']);
  });
});
