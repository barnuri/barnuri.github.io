import type { Page } from 'playwright';
import { activityPostsUrl } from '../../consts/linkedin-api.ts';
import type { PostCollection } from '../../schemas/linkedin/post-collection.ts';
import { type RawBrowserPost, richerPost, toBrowserPost } from './browser-post.ts';
import { LinkedInBrowser } from './linkedin-browser.ts';
import { LinkedInMediaDownloader } from './media-downloader.ts';

export interface ActivityScraperOptions {
  readonly profileDir: string;
  readonly vanityName: string;
  readonly maxPosts: number;
  readonly mediaDir: string;
  readonly mediaPublicPrefix: string;
}

export class LinkedInActivityScraper {
  static readonly SCROLL_PAUSE_MS = 2_500;
  static readonly SETTLE_MS = 5_000;
  static readonly IDLE_SCROLLS_TO_STOP = 6;
  static readonly SCROLL_PIXELS = 1_500;
  static readonly MAX_IMAGES_PER_POST = 4;
  static readonly MAX_VIDEO_BYTES = 30 * 1_048_576;

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
      console.log(`Read ${raw.length} posts from ${url}. Downloading their images and videos.`);
      const downloader = new LinkedInMediaDownloader(context.request, {
        outputDir: this.options.mediaDir,
        publicPrefix: this.options.mediaPublicPrefix,
        maxImagesPerPost: LinkedInActivityScraper.MAX_IMAGES_PER_POST,
        maxVideoBytes: LinkedInActivityScraper.MAX_VIDEO_BYTES,
      });
      const posts = [];
      for (const post of raw) {
        posts.push(toBrowserPost(post, await downloader.download(post)));
      }
      return {
        source: 'browser',
        fetched_at: this.now().toISOString(),
        author_urn: null,
        posts,
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
        const current = posts.get(post.activityId);
        posts.set(post.activityId, current ? richerPost(current, post) : post);
      }
      idleScrolls = posts.size === before ? idleScrolls + 1 : 0;
      await page.mouse.wheel(0, LinkedInActivityScraper.SCROLL_PIXELS);
      await page.waitForTimeout(LinkedInActivityScraper.SCROLL_PAUSE_MS);
      if (idleScrolls > 0) {
        await LinkedInActivityScraper.loadMore(page);
      }
    }
    return [...posts.values()].slice(0, this.options.maxPosts);
  }

  private static async loadMore(page: Page): Promise<void> {
    const showMore = page.getByRole('button', { name: /show more results/i }).first();
    if (await showMore.isVisible().catch(() => false)) {
      await showMore.click().catch(() => undefined);
    }
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(LinkedInActivityScraper.SCROLL_PAUSE_MS);
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
        const imageUrls = [...container.querySelectorAll('img')]
          .map((img) => img.getAttribute('src') ?? '')
          .filter((src) => /^https:\/\/media\.licdn\.com\/dms\/image\//.test(src) && /(feedshare|article-cover|image-shrink)/.test(src));
        const videoElement = container.querySelector('video');
        const videoSrc = videoElement?.getAttribute('src') ?? null;
        const video = videoElement || container.querySelector('[class*="update-components-linkedin-video"]')
          ? { src: videoSrc && videoSrc.startsWith('https://') ? videoSrc : null, poster: videoElement?.getAttribute('poster') ?? null }
          : null;
        const article = container.querySelector('[class*="update-components-article"] a[href^="http"]');
        return [
          {
            activityId,
            text: textElement?.innerText ?? '',
            reactionsText: reactionsElement?.textContent?.replace(/\s+/g, ' ').trim() ?? null,
            commentsText: buttonText(container, /\d[\d,]*\s+comments?/i),
            repostsText: buttonText(container, /\d[\d,]*\s+reposts?/i),
            imageUrls: [...new Set(imageUrls)],
            video,
            hasDocument: !!container.querySelector('[class*="update-components-document"]'),
            articleUrl: article?.getAttribute('href') ?? null,
          },
        ];
      });
    });
  }
}
