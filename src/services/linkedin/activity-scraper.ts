import type { Page } from 'playwright';
import { activityPostsUrl } from '../../consts/linkedin-api.ts';
import type { PostCollection } from '../../schemas/linkedin/post-collection.ts';
import { type RawBrowserPost, toBrowserPost } from './browser-post.ts';
import { LinkedInBrowser } from './linkedin-browser.ts';

export interface ActivityScraperOptions {
  readonly profileDir: string;
  readonly vanityName: string;
  readonly maxPosts: number;
}

export class LinkedInActivityScraper {
  static readonly SCROLL_PAUSE_MS = 2_500;
  static readonly SETTLE_MS = 5_000;
  static readonly IDLE_SCROLLS_TO_STOP = 3;
  static readonly SCROLL_PIXELS = 3_000;

  constructor(
    private readonly options: ActivityScraperOptions,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async scrape(): Promise<PostCollection> {
    const context = await LinkedInBrowser.launch(this.options.profileDir);
    try {
      const page = await LinkedInBrowser.firstPage(context);
      const url = activityPostsUrl(this.options.vanityName);
      await LinkedInBrowser.openWithLogin(page, url, (current) => current.includes('/recent-activity/'));
      await page.waitForTimeout(LinkedInActivityScraper.SETTLE_MS);
      const raw = await this.collectWhileScrolling(page);
      console.log(`Read ${raw.length} posts from ${url}.`);
      return {
        source: 'browser',
        fetched_at: this.now().toISOString(),
        author_urn: null,
        posts: raw.map(toBrowserPost),
        unavailable_fields: [],
      };
    } finally {
      await LinkedInBrowser.close(context);
    }
  }

  private async collectWhileScrolling(page: Page): Promise<RawBrowserPost[]> {
    const posts = new Map<string, RawBrowserPost>();
    let idleScrolls = 0;
    while (idleScrolls < LinkedInActivityScraper.IDLE_SCROLLS_TO_STOP && posts.size < this.options.maxPosts) {
      const before = posts.size;
      for (const post of await LinkedInActivityScraper.readVisiblePosts(page)) {
        if (!posts.has(post.activityId)) {
          posts.set(post.activityId, post);
        }
      }
      idleScrolls = posts.size === before ? idleScrolls + 1 : 0;
      await page.mouse.wheel(0, LinkedInActivityScraper.SCROLL_PIXELS);
      await page.waitForTimeout(LinkedInActivityScraper.SCROLL_PAUSE_MS);
    }
    return [...posts.values()].slice(0, this.options.maxPosts);
  }

  /** Only posts you wrote carry an analytics link, so it identifies your posts and skips reposts. */
  private static async readVisiblePosts(page: Page): Promise<RawBrowserPost[]> {
    return page.evaluate(() => {
      const analyticsSelector = 'a[href*="/analytics/post-summary/urn:li:activity:"]';
      const containerOf = (link: Element): Element => {
        let container: Element = link;
        while (container.parentElement && container.parentElement.querySelectorAll(analyticsSelector).length === 1) {
          container = container.parentElement;
        }
        return container;
      };
      const buttonText = (container: Element, pattern: RegExp): string | null =>
        [...container.querySelectorAll('button, a, span')]
          .map((element) => (element.textContent ?? '').replace(/\s+/g, ' ').trim())
          .find((text) => pattern.test(text)) ?? null;

      return [...document.querySelectorAll(analyticsSelector)].flatMap((link) => {
        const activityId = link.getAttribute('href')?.match(/urn:li:activity:(\d+)/)?.[1];
        if (!activityId) {
          return [];
        }
        const container = containerOf(link);
        const textElement = container.querySelector('.update-components-text') as HTMLElement | null;
        const reactionsElement = container.querySelector('[class*="social-details-social-counts__reactions"]');
        const mediaKinds = [
          container.querySelector('.update-components-image, [class*="update-components-image"]') ? 'image' : null,
          container.querySelector('video, [class*="update-components-linkedin-video"]') ? 'video' : null,
          container.querySelector('[class*="update-components-document"]') ? 'document' : null,
        ].filter((kind): kind is string => kind !== null);
        const article = container.querySelector('[class*="update-components-article"] a[href^="http"]');
        return [
          {
            activityId,
            text: textElement?.innerText ?? '',
            reactionsText: reactionsElement?.textContent?.replace(/\s+/g, ' ').trim() ?? null,
            commentsText: buttonText(container, /\d[\d,]*\s+comments?/i),
            repostsText: buttonText(container, /\d[\d,]*\s+reposts?/i),
            mediaKinds,
            articleUrl: article?.getAttribute('href') ?? null,
          },
        ];
      });
    });
  }
}
