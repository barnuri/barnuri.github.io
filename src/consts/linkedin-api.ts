export const API_BASE_URL = 'https://api.linkedin.com';
export const OAUTH_BASE_URL = 'https://www.linkedin.com/oauth/v2';
export const DEFAULT_API_VERSION = '202609';
export const RESTLI_PROTOCOL_VERSION = '2.0.0';

export const READ_POSTS_SCOPE = 'r_member_social';
export const OAUTH_SCOPES = ['openid', 'profile', READ_POSTS_SCOPE] as const;
export const GITHUB_SECRET_NAME = 'LINKEDIN_ACCESS_TOKEN';

export const PAGE_SIZE = 100;
export const MAX_PAGES = 100;

export const MAX_RETRIES = 4;
export const DEFAULT_RETRY_SECONDS = 5;
export const MAX_RETRY_SECONDS = 120;
export const RETRYABLE_STATUS_CODES: ReadonlySet<number> = new Set([429, 500, 502, 503, 504]);

export const postUrl = (urn: string): string => `https://www.linkedin.com/feed/update/${urn}/`;
