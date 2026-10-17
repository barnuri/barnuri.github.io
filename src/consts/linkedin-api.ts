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

export const POST_SOURCES = ['api', 'export'] as const;

export const ARCHIVE_FILES = {
  shares: 'Shares.csv',
  positions: 'Positions.csv',
  education: 'Education.csv',
} as const;
export type ArchiveFileKey = keyof typeof ARCHIVE_FILES;
export const DEFAULT_IMPORT_DIR = 'imports/linkedin';

export const EXPORT_PAGE_URL = 'https://www.linkedin.com/mypreferences/d/download-my-data';
export const LOGIN_PATH_PREFIXES = ['/login', '/uas/', '/checkpoint/', '/authwall', '/signup'] as const;
export const EXPORT_PAGE_PATH = '/mypreferences/d/download-my-data';
export const EXPORT_CATEGORY_LABELS = [/^profile$/i, /^positions$/i, /^education$/i, /^(shares|posts)$/i] as const;
export const DEFAULT_EXPORT_WAIT_MINUTES = 20;
export const RECENT_ARCHIVE_HOURS = 24;
