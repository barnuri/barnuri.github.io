import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { HomePage } from '../../src/components/HomePage.tsx';
import type { ActivityItem } from '../../src/schemas/github/activity-item.ts';
import type { GitHubData } from '../../src/schemas/github/github-data.ts';
import type { LinkedInPost } from '../../src/schemas/linkedin/linkedin-post.ts';
import type { LinkedInProfile } from '../../src/schemas/linkedin/linkedin-profile.ts';

const activityItem = (index: number): ActivityItem => ({
  id: `pull_request:${index}`,
  kind: 'pull_request',
  occurredAt: `2026-10-${String(30 - index).padStart(2, '0')}T08:00:00Z`,
  repo: { name: 'nanocoai/nanoclaw', url: 'https://github.com/nanocoai/nanoclaw' },
  title: `<i>PR ${index}</i>`,
  url: `https://github.com/nanocoai/nanoclaw/pull/${index}`,
  count: null,
  state: 'MERGED',
});

const github: GitHubData = {
  featured: [
    {
      name: 'herdr-web',
      description: '<script>alert(1)</script>',
      url: 'https://github.com/barnuri/herdr-web',
      stars: 1,
      language: 'TypeScript',
      languageColor: 'red;background:url(x)',
      pushedAt: '2026-10-14T10:00:00Z',
    },
  ],
  recent: [
    {
      name: 'ghx',
      description: '',
      url: 'https://github.com/barnuri/ghx',
      stars: 0,
      language: null,
      languageColor: null,
      pushedAt: '2026-10-15T10:00:00Z',
    },
  ],
  contributions: {
    total: 2911,
    weeks: [[{ date: '2026-01-04', count: 0, level: 0 }], [{ date: '2026-02-01', count: 5, level: 3 }]],
  },
  activity: { items: [], privateContributions: 0 },
};

const linkedInPost: LinkedInPost = {
  id: 'urn:li:share:1',
  text: '<b>hi</b>',
  published_at: '2026-05-05T08:00:00.000Z',
  url: 'https://www.linkedin.com/feed/update/urn:li:share:1/',
  visibility: null,
  media: [],
  engagement: { likes: null, comments: null, shares: null },
};

const render = (posts: LinkedInPost[] = [], data: GitHubData = github, profile: LinkedInProfile | null = null): string =>
  renderToStaticMarkup(
    <HomePage github={data} linkedInPosts={posts} linkedInProfile={profile} builtAt="2026-10-16T00:00:00Z" stylesheet="" />,
  );

const withActivity = (count: number, privateContributions = 0): GitHubData => ({
  ...github,
  activity: { items: Array.from({ length: count }, (_, index) => activityItem(index)), privateContributions },
});

describe('HomePage', () => {
  test('escapes repo text and blocks unsafe language colors', () => {
    const html = render();

    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).toContain('background:currentColor');
    expect(html).toContain('1 star<');
  });

  test('draws one cell per day with an accessible total', () => {
    const html = render();

    expect(html.match(/<rect /g)).toHaveLength(2);
    expect(html).toContain('class="l3"');
    expect(html).toContain('aria-label="2,911 contributions on GitHub in the last year"');
    expect(html).toContain('>Feb</text>');
  });

  test('shows the last push date and omits empty descriptions', () => {
    const html = render();

    expect(html).toContain('Updated Oct 15, 2026');
    expect(html.match(/repo-description/g)).toHaveLength(1);
  });

  test('hides the LinkedIn section without posts', () => {
    expect(render()).not.toContain('Latest on LinkedIn');
  });

  test('shows escaped LinkedIn posts with a link', () => {
    const html = render([linkedInPost]);

    expect(html).toContain('Latest on LinkedIn');
    expect(html).toContain('&lt;b&gt;hi&lt;/b&gt;');
    expect(html).toContain('href="https://www.linkedin.com/feed/update/urn:li:share:1/"');
    expect(html).toContain('May 5, 2026');
  });
});

describe('HomePage activity feed', () => {
  test('is hidden without activity', () => {
    expect(render()).not.toContain('Recent activity');
  });

  test('shows the first ten items and hides the rest behind show more', () => {
    const html = render([], withActivity(12));

    expect(html.match(/class="activity-item"/g)).toHaveLength(12);
    expect(html.match(/class="activity-item" hidden=""/g)).toHaveLength(2);
    expect(html).toContain('class="show-more"');
    expect(html).toContain('<noscript>');
  });

  test('has no show more button with ten items or fewer', () => {
    expect(render([], withActivity(10))).not.toContain('class="show-more"');
  });

  test('escapes titles and shows the state', () => {
    const html = render([], withActivity(1));

    expect(html).toContain('&lt;i&gt;PR 0&lt;/i&gt;');
    expect(html).toContain('Opened a pull request in');
    expect(html).toContain('Merged');
  });

  test('shows the private contribution count without repository names', () => {
    expect(render([], withActivity(1, 2484))).toContain('Plus 2,484 contributions in private repositories');
  });
});

describe('HomePage experience and education', () => {
  const profile: LinkedInProfile = {
    imported_at: '2026-10-16T00:00:00.000Z',
    headline: null,
    summary: null,
    positions: [
      {
        company: 'Check Point',
        title: 'Software Developer',
        description: 'Builds <agent> tooling',
        location: 'Tel Aviv',
        startedOn: { year: 2022, month: 3 },
        finishedOn: null,
      },
    ],
    education: [{ school: 'Open University', degree: 'B.Sc. Computer Science', notes: null, startedOn: { year: 2015, month: null }, finishedOn: { year: 2019, month: null } }],
  };

  test('are hidden without profile data', () => {
    const html = render();

    expect(html).not.toContain('Experience</h2>');
    expect(html).not.toContain('Education</h2>');
  });

  test('show positions with date ranges and escaped text', () => {
    const html = render([], github, profile);

    expect(html).toContain('Software Developer');
    expect(html).toContain('Check Point, Tel Aviv');
    expect(html).toContain('Mar 2022 – Present');
    expect(html).toContain('Builds &lt;agent&gt; tooling');
  });

  test('show education with year ranges', () => {
    const html = render([], github, profile);

    expect(html).toContain('Open University');
    expect(html).toContain('B.Sc. Computer Science');
    expect(html).toContain('2015 – 2019');
  });
});
