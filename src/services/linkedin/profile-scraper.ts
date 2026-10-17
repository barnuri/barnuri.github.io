import type { Page } from 'playwright';
import type { Education } from '../../schemas/linkedin/education.ts';
import type { Position } from '../../schemas/linkedin/position.ts';
import { LinkedInBrowser } from './linkedin-browser.ts';
import { type RawProfileEntry, toEducation, toPosition } from './profile-lines.ts';

export interface ProfileScraperOptions {
  readonly profileDir: string;
  readonly vanityName: string;
}

export interface ScrapedProfile {
  readonly positions: Position[];
  readonly education: Education[];
}

export class LinkedInProfileScraper {
  static readonly SETTLE_MS = 6_000;

  constructor(private readonly options: ProfileScraperOptions) {}

  async scrape(): Promise<ScrapedProfile> {
    const context = await LinkedInBrowser.launch(this.options.profileDir);
    try {
      const page = await LinkedInBrowser.firstPage(context);
      const experience = await this.readSection(page, 'experience');
      const education = await this.readSection(page, 'education');
      return {
        positions: experience.map(toPosition).filter((position): position is Position => position !== null),
        education: education.map(toEducation).filter((entry): entry is Education => entry !== null),
      };
    } finally {
      await LinkedInBrowser.close(context);
    }
  }

  private async readSection(page: Page, section: 'experience' | 'education'): Promise<RawProfileEntry[]> {
    const url = `https://www.linkedin.com/in/${this.options.vanityName}/details/${section}/`;
    await LinkedInBrowser.openWithLogin(page, url, (current) => current.includes(`/details/${section}`));
    await page.waitForTimeout(LinkedInProfileScraper.SETTLE_MS);
    const entries = await LinkedInProfileScraper.readEntries(page, section);
    console.log(`Read ${entries.length} ${section} entries from ${url}.`);
    return entries;
  }

  /** Only the profile owner sees an edit link on each entry, so the link marks one role or school. */
  private static async readEntries(page: Page, section: string): Promise<RawProfileEntry[]> {
    return page.evaluate((sectionName) => {
      const editSelector = `a[href*="/details/${sectionName}/edit/forms/"]`;
      const clean = (text: string | null): string => (text ?? '').replace(/\s+/g, ' ').trim();
      const formsIn = (element: Element): number =>
        new Set([...element.querySelectorAll(editSelector)].map((anchor) => anchor.getAttribute('href'))).size;
      const uniqueAnchors = new Map<string, Element>();
      for (const anchor of document.querySelectorAll(editSelector)) {
        const href = anchor.getAttribute('href');
        if (href && !uniqueAnchors.has(href)) {
          uniqueAnchors.set(href, anchor);
        }
      }
      return [...uniqueAnchors.values()].map((anchor) => {
        const item = anchor.closest('li') ?? anchor.parentElement ?? anchor;
        let group: Element | null = item.parentElement;
        while (group && formsIn(group) < 2) {
          group = group.parentElement;
        }
        const container = group?.parentElement ?? null;
        const header = container
          ? [...container.querySelectorAll('p')].find((p) => !group?.contains(p) && !p.closest(editSelector))
          : undefined;
        return {
          lines: [...anchor.querySelectorAll('p')].map((p) => clean(p.textContent)).filter(Boolean),
          groupHeader: header ? clean(header.textContent) : null,
          rest: (item as HTMLElement).innerText ?? '',
        };
      });
    }, section);
  }
}
