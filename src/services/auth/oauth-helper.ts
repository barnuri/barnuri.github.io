import type { LinkedInSettings } from '../../configs/linkedin-settings.ts';
import { GITHUB_SECRET_NAME, OAUTH_BASE_URL, OAUTH_SCOPES } from '../../consts/linkedin-api.ts';
import { AuthenticationError } from '../../errors/authentication-error.ts';
import { TokenResponse } from '../../schemas/linkedin/token-response.ts';
import type { Fetch } from '../linkedin/linkedin-client.ts';

export type SecretStore = (name: string, repo: string, value: string) => Promise<void>;

export class OAuthHelper {
  private readonly clientId: string;

  constructor(
    private readonly settings: LinkedInSettings,
    private readonly fetchImpl: Fetch = fetch,
  ) {
    if (!settings.hasClientCredentials || settings.clientId === null) {
      throw new AuthenticationError('Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in your shell session first.');
    }
    this.clientId = settings.clientId;
  }

  authorizationUrl(redirectUri: string, state: string): string {
    const query = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: redirectUri,
      state,
      scope: OAUTH_SCOPES.join(' '),
    });
    return `${OAUTH_BASE_URL}/authorization?${query}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<TokenResponse> {
    const response = await this.fetchImpl(`${OAUTH_BASE_URL}/accessToken`, {
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: this.clientId,
        client_secret: this.settings.clientSecret(),
      }),
    });
    if (!response.ok) {
      throw new AuthenticationError(
        `LinkedIn did not exchange the code (${response.status}). Codes expire after a few minutes; run auth-url again.`,
        response.status,
      );
    }
    return TokenResponse.parse(await response.json());
  }

  static async storeWithGh(name: string, repo: string, value: string): Promise<void> {
    const child = Bun.spawn(['gh', 'secret', 'set', name, '--repo', repo], {
      stdin: new TextEncoder().encode(value),
      stdout: 'ignore',
      stderr: 'pipe',
    });
    const exitCode = await child.exited;
    if (exitCode !== 0) {
      const stderr = await new Response(child.stderr).text();
      throw new Error(`gh secret set exited with ${exitCode}: ${stderr.trim()}`);
    }
  }

  static async storeToken(token: TokenResponse, repo: string, store: SecretStore = OAuthHelper.storeWithGh): Promise<void> {
    await store(GITHUB_SECRET_NAME, repo, token.access_token);
  }
}
