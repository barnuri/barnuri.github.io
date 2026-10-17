import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { AboutPage } from '../../src/components/AboutPage.tsx';
import { ContributionsPage } from '../../src/components/ContributionsPage.tsx';
import { HomePage } from '../../src/components/HomePage.tsx';
import { PostsPage } from '../../src/components/PostsPage.tsx';
import { ProjectsPage } from '../../src/components/ProjectsPage.tsx';
import type { ActivityItem } from '../../src/schemas/github/activity-item.ts';
import type { GitHubData } from '../../src/schemas/github/github-data.ts';
import type { LinkedInPost } from '../../src/schemas/linkedin/linkedin-post.ts';
import type { LinkedInProfile } from '../../src/schemas/linkedin/linkedin-profile.ts';

const shared = { builtAt: '2026-10-17T00:00:00Z', stylesheet: '' };

const item = (index: number, repo: string, overrides: Partial<ActivityItem> = {}): ActivityItem => ({
  id: `item-${index}`,
  kind: 'commits',
  occurredAt: `2026-10-${String(28 - index).padStart(2, '0')}T08:00:00Z`,
  repo: { name: repo, url: `https://github.com/${repo}` },
  title: null,
  url: `https://github.com/${repo}/commits`,
  count: 2,
  state: null,
  ...overrides,
});

const items: ActivityItem[] = [
  ...Array.from({ length: 11 }, (_, index) => item(index, 'barnuri/ghx')),
  item(11, 'nanocoai/nanoclaw', { kind: 'pull_request', title: '<i>fix tests</i>', url: 'https://github.com/nanocoai/nanoclaw/pull/1', count: null, state: 'MERGED' }),
  item(12, 'argoproj/argo-cd', { kind: 'review', title: 'feat(ui)', url: 'https://github.com/argoproj/argo-cd/pull/2#r', count: null }),
];

const github: GitHubData = {
  featured: [
    {
      name: 'herdr-web',
      description: '<script>alert(1)</script>',
      url: 'https://github.com/barnuri/herdr-web',
      stars: 12,
      language: 'TypeScript',
      languageColor: 'red;background:url(x)',
      pushedAt: '2026-10-14T10:00:00Z',
    },
  ],
  recent: [],
  contributions: { total: 2911, weeks: [[{ date: '2026-01-04', count: 0, level: 0 }], [{ date: '2026-02-01', count: 5, level: 3 }]] },
  activity: { items, privateContributions: 2460 },
  stats: {
    publicRepos: 40,
    stars: 44,
    followers: 6,
    languages: [{ name: 'TypeScript', color: '#3178c6', share: 41.5 }],
    year: { commits: 324, pullRequests: 41, reviews: 5, issues: 2, reposCreated: 18, contributedRepos: 23 },
  },
};

const post: LinkedInPost = {
  id: 'urn:li:activity:1',
  text: 'השבוע ניסיתי <b>herdr</b>',
  published_at: '2026-08-24T14:11:25.798Z',
  url: 'https://www.linkedin.com/feed/update/urn:li:activity:1/',
  visibility: null,
  media: [],
  engagement: { likes: 50, comments: 8, shares: null },
};

const profile: LinkedInProfile = {
  imported_at: '2026-10-17T00:00:00.000Z',
  headline: 'Technology Leader at AI & Innovation Team',
  summary: null,
  positions: [{ company: 'Check Point Software', title: 'Technology Leader', description: 'Builds agents', location: 'Israel', startedOn: { year: 2025, month: 2 }, finishedOn: null }],
  education: [{ school: 'The Open University of Israel', degree: 'BS, Computer Science', notes: null, startedOn: { year: 2016, month: null }, finishedOn: { year: 2019, month: null } }],
};

const home = (): string => renderToStaticMarkup(<HomePage github={github} linkedInPosts={[post]} {...shared} />);

describe('every page', () => {
  test('starts in dark mode, marks the current nav link and has a theme toggle', () => {
    const html = home();

    expect(html).toContain('data-theme="dark"');
    expect(html).toMatch(/href="\/" aria-current="page"/);
    expect(html).toContain('data-theme-toggle');
    expect(html).toContain('href="/projects/"');
  });
});

describe('HomePage', () => {
  test('escapes repo and activity text and blocks unsafe colors', () => {
    const html = renderToStaticMarkup(<ProjectsPage github={github} {...shared} />);

    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('background:currentColor');
  });

  test('renders the filterable feed with own and contribution items and hides past the first 10', () => {
    const html = home();

    expect(html).toContain('data-filter="own"');
    expect(html).toContain('data-filter="ext"');
    expect(html.match(/data-side="own"/g)).toHaveLength(11);
    expect(html.match(/data-side="ext"/g)).toHaveLength(2);
    expect(html.match(/class="feed-item" data-item="true" data-side="[a-z]+" hidden=""/g)).toHaveLength(3);
    expect(html).toContain('&lt;i&gt;fix tests&lt;/i&gt;');
    expect(html).toContain('Merged');
  });

  test('shows stats, the private count and the latest post right-to-left aware', () => {
    const html = home();

    expect(html).toContain('324');
    expect(html).toContain('2,460 contributions in private repositories');
    expect(html).toContain('dir="auto"');
    expect(html).toContain('50 reactions');
  });
});

describe('ContributionsPage', () => {
  test('counts pull requests by state and lists only other repos', () => {
    const html = renderToStaticMarkup(<ContributionsPage github={github} {...shared} />);

    expect(html).toContain('nanocoai/nanoclaw');
    expect(html).toContain('argoproj/argo-cd');
    expect(html).not.toContain('Pushed');
    expect(html).toMatch(/aria-current="page"[^>]*>Contributions/);
  });
});

describe('AboutPage', () => {
  test('shows headline, experience and education without posts', () => {
    const html = renderToStaticMarkup(<AboutPage profile={profile} {...shared} />);

    expect(html).toContain('Technology Leader at AI &amp; Innovation Team');
    expect(html).toContain('Check Point Software, Israel');
    expect(html).toContain('Feb 2025 – Present');
    expect(html).toContain('2016 – 2019');
    expect(html).not.toContain('Read on LinkedIn');
  });

  test('shows empty states that point to LinkedIn without profile data', () => {
    const html = renderToStaticMarkup(<AboutPage profile={null} {...shared} />);

    expect(html).toContain('Experience is not imported yet');
  });
});

describe('PostsPage', () => {
  test('lists every post with totals and marks Posts in the nav', () => {
    const html = renderToStaticMarkup(<PostsPage posts={[post, { ...post, id: 'urn:li:activity:2', engagement: { likes: 4, comments: null, shares: null } }]} {...shared} />);

    expect(html).toMatch(/aria-current="page"[^>]*>Posts/);
    expect(html).toContain('id="all-posts-list"');
    expect(html.match(/Read on LinkedIn/g)).toHaveLength(2);
    expect(html).toContain('54');
  });

  test('shows an empty state without posts', () => {
    expect(renderToStaticMarkup(<PostsPage posts={[]} {...shared} />)).toContain('No posts imported yet');
  });
});

describe('HomePage posts link', () => {
  test('points All posts to the Posts page', () => {
    expect(home()).toMatch(/href="\/posts\/"[^>]*>All posts/);
  });
});
