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

export const POST_SOURCES = ['api', 'export', 'browser'] as const;

export const ARCHIVE_FILES = {
  shares: 'Shares.csv',
  positions: 'Positions.csv',
  education: 'Education.csv',
  profile: 'Profile.csv',
} as const;
export type ArchiveFileKey = keyof typeof ARCHIVE_FILES;
export const DEFAULT_IMPORT_DIR = 'imports/linkedin';

export const EXPORT_PAGE_URL = 'https://www.linkedin.com/mypreferences/d/download-my-data';
export const LOGIN_PATH_PREFIXES = ['/login', '/uas/', '/checkpoint/', '/authwall', '/signup'] as const;
export const EXPORT_PAGE_PATH = '/mypreferences/d/download-my-data';
export const PROFILE_LABEL = /^profile$/i;
export const EXPORT_CATEGORY_LABELS: readonly RegExp[] = [PROFILE_LABEL, /^articles$/i];
export const EXPORT_REQUIRED_LABELS: readonly RegExp[] = [PROFILE_LABEL];
export const EXPORT_RADIO_IDS = { particular: 'fast-file-only', full: 'fast-file-only-plus-other-data' } as const;
export const EXPORT_FORM_TEXT = /want something in particular|download larger data archive|download archive/i;
export const DEFAULT_EXPORT_WAIT_MINUTES = 20;
export const RECENT_ARCHIVE_HOURS = 24;
export const BROWSER_PROFILE_DIR = '.playwright-linkedin';
export const PLAYWRIGHT_MOCK_KEYCHAIN_FLAG = '--use-mock-keychain';
export const LINKEDIN_VANITY_NAME = 'barnuri';
export const activityPostsUrl = (vanityName: string): string => `https://www.linkedin.com/in/${vanityName}/recent-activity/shares/`;
export const MAX_SCRAPED_POSTS = 300;
