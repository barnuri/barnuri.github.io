export const GITHUB_LOGIN = 'barnuri';
export const GITHUB_URL = 'https://github.com/barnuri';
export const LINKEDIN_URL = 'https://www.linkedin.com/in/barnuri/';
export const SITE_NAME = 'Bar Nuri';
export const SITE_DESCRIPTION =
  'Bar Nuri, software developer at Check Point. Open-source tools for coding agents and developer workflows.';
export const PROFILE_LEDE = 'Software developer at Check Point. I build open-source tools for coding agents and the workflows around them.';

export const THEME_STORAGE_KEY = 'theme';
export const DEFAULT_THEME = 'dark';

export const PAGES = {
  home: { href: '/', label: 'Home', file: 'index.html' },
  projects: { href: '/projects/', label: 'Projects', file: 'projects/index.html' },
  contributions: { href: '/contributions/', label: 'Contributions', file: 'contributions/index.html' },
  posts: { href: '/posts/', label: 'Posts', file: 'posts/index.html' },
  about: { href: '/about/', label: 'About', file: 'about/index.html' },
} as const;

export type PageKey = keyof typeof PAGES;

export const FEED_PAGE_SIZE = 10;
export const HOME_POST_COUNT = 3;
export const POSTS_PAGE_SIZE = 10;
export const TOP_REPO_COUNT = 6;
