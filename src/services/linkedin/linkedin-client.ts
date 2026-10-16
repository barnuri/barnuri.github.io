import type { LinkedInSettings } from '../../configs/linkedin-settings.ts';
import {
  DEFAULT_RETRY_SECONDS,
  MAX_RETRIES,
  MAX_RETRY_SECONDS,
  OAUTH_BASE_URL,
  RESTLI_PROTOCOL_VERSION,
  RETRYABLE_STATUS_CODES,
} from '../../consts/linkedin-api.ts';
import { AuthenticationError } from '../../errors/authentication-error.ts';
import { LinkedInApiError } from '../../errors/linkedin-api-error.ts';
import { MissingPermissionError } from '../../errors/missing-permission-error.ts';
import { IntrospectionResponse } from '../../schemas/linkedin/introspection-response.ts';
import { TokenInfo } from '../../schemas/linkedin/token-info.ts';

export type Fetch = (input: string, init: RequestInit) => Promise<Response>;
export type Sleep = (milliseconds: number) => Promise<void>;
export type JsonObject = Record<string, unknown>;

export class LinkedInClient {
  constructor(
    private readonly settings: LinkedInSettings,
    private readonly fetchImpl: Fetch = fetch,
    private readonly sleep: Sleep = Bun.sleep,
  ) {
    if (!settings.hasAccessToken) {
      throw new AuthenticationError('LINKEDIN_ACCESS_TOKEN is not set.');
    }
  }

  async getJson(url: string, restliMethod?: string): Promise<JsonObject> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.settings.accessToken()}`,
      'Linkedin-Version': this.settings.apiVersion,
      'X-Restli-Protocol-Version': RESTLI_PROTOCOL_VERSION,
    };
    if (restliMethod) {
      headers['X-RestLi-Method'] = restliMethod;
    }
    const response = await this.sendWithRetries(() => this.fetchImpl(url, { method: 'GET', headers }));
    await LinkedInClient.throwForStatus(response);
    const text = await response.text();
    return text ? (JSON.parse(text) as JsonObject) : {};
  }

  async introspectToken(): Promise<TokenInfo> {
    if (!this.settings.hasClientCredentials || this.settings.clientId === null) {
      throw new AuthenticationError('LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET are required to check token scopes.');
    }
    const body = new URLSearchParams({
      client_id: this.settings.clientId,
      client_secret: this.settings.clientSecret(),
      token: this.settings.accessToken(),
    });
    const response = await this.sendWithRetries(() =>
      this.fetchImpl(`${OAUTH_BASE_URL}/introspectToken`, { method: 'POST', body }),
    );
    await LinkedInClient.throwForStatus(response);
    return TokenInfo.fromIntrospection(IntrospectionResponse.parse(await response.json()));
  }

  private async sendWithRetries(send: () => Promise<Response>): Promise<Response> {
    for (let attempt = 0; ; attempt++) {
      const isLastAttempt = attempt === MAX_RETRIES;
      let response: Response;
      try {
        response = await send();
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        if (isLastAttempt) {
          throw new LinkedInApiError(`LinkedIn request failed after ${attempt + 1} attempts: ${reason}`);
        }
        await this.wait(attempt, null, `a network error (${reason})`);
        continue;
      }
      if (!RETRYABLE_STATUS_CODES.has(response.status) || isLastAttempt) {
        return response;
      }
      await this.wait(attempt, response.headers.get('Retry-After'), `status ${response.status}`);
    }
  }

  private async wait(attempt: number, retryAfter: string | null, reason: string): Promise<void> {
    const requested = retryAfter && /^\d+$/.test(retryAfter) ? Number(retryAfter) : DEFAULT_RETRY_SECONDS * 2 ** attempt;
    const seconds = Math.min(requested, MAX_RETRY_SECONDS);
    console.warn(`LinkedIn returned ${reason}. Retrying in ${seconds} seconds.`);
    await this.sleep(seconds * 1000);
  }

  private static async throwForStatus(response: Response): Promise<void> {
    if (response.ok) {
      return;
    }
    const detail = await LinkedInClient.errorMessage(response);
    if (response.status === 401) {
      throw new AuthenticationError(`LinkedIn rejected the access token (401): ${detail}`, 401);
    }
    if (response.status === 403) {
      throw new MissingPermissionError(`LinkedIn denied access (403): ${detail}`, 403);
    }
    throw new LinkedInApiError(`LinkedIn request failed (${response.status}): ${detail}`, response.status);
  }

  private static async errorMessage(response: Response): Promise<string> {
    const text = await response.text();
    try {
      const body = JSON.parse(text) as JsonObject;
      return String(body.message ?? body.error_description ?? body.error ?? text);
    } catch {
      return text.slice(0, 200);
    }
  }
}
