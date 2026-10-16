import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { HomePage } from '../../src/components/HomePage.tsx';
import type { GitHubData } from '../../src/schemas/github/github-data.ts';
import type { LinkedInPost } from '../../src/schemas/linkedin/linkedin-post.ts';

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

const render = (posts: LinkedInPost[] = []): string =>
  renderToStaticMarkup(<HomePage github={github} linkedInPosts={posts} builtAt="2026-10-16T00:00:00Z" stylesheet="" />);

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
