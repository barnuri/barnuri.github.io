import { DEFAULT_API_VERSION } from '../consts/linkedin-api.ts';

type Environment = Readonly<Record<string, string | undefined>>;

export class LinkedInSettings {
  static readonly API_VERSION_PATTERN = /^\d{6}$/;

  readonly #accessToken: string | null;
  readonly #clientSecret: string | null;

  private constructor(
    accessToken: string | null,
    readonly clientId: string | null,
    clientSecret: string | null,
    readonly apiVersion: string,
  ) {
    if (!LinkedInSettings.API_VERSION_PATTERN.test(apiVersion)) {
      throw new Error(`LINKEDIN_API_VERSION must use the YYYYMM format, got "${apiVersion}".`);
    }
    this.#accessToken = accessToken;
    this.#clientSecret = clientSecret;
  }

  static fromEnv(environment: Environment = process.env): LinkedInSettings {
    const read = (name: string): string | null => environment[name]?.trim() || null;
    return new LinkedInSettings(
      read('LINKEDIN_ACCESS_TOKEN'),
      read('LINKEDIN_CLIENT_ID'),
      read('LINKEDIN_CLIENT_SECRET'),
      read('LINKEDIN_API_VERSION') ?? DEFAULT_API_VERSION,
    );
  }

  get hasAccessToken(): boolean {
    return this.#accessToken !== null;
  }

  get hasClientCredentials(): boolean {
    return this.clientId !== null && this.#clientSecret !== null;
  }

  accessToken(): string {
    if (this.#accessToken === null) {
      throw new Error('LINKEDIN_ACCESS_TOKEN is not set.');
    }
    return this.#accessToken;
  }

  clientSecret(): string {
    if (this.#clientSecret === null) {
      throw new Error('LINKEDIN_CLIENT_SECRET is not set.');
    }
    return this.#clientSecret;
  }

  toJSON(): Record<string, unknown> {
    return {
      clientId: this.clientId,
      apiVersion: this.apiVersion,
      hasAccessToken: this.hasAccessToken,
      hasClientSecret: this.#clientSecret !== null,
    };
  }
}
