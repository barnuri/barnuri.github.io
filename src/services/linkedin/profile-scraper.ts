import { mkdir, readdir } from 'node:fs/promises';
import type { BrowserContext, Page } from 'playwright';
import type { Education } from '../../schemas/linkedin/education.ts';
import type { Position } from '../../schemas/linkedin/position.ts';
import { LinkedInBrowser } from './linkedin-browser.ts';
import { LinkedInMediaDownloader } from './media-downloader.ts';
import { parseSkillsDialog, type RawProfileEntry, slugify, toEducation, toPosition } from './profile-lines.ts';

export interface ProfileScraperOptions {
  readonly profileDir: string;
  readonly vanityName: string;
  readonly logoDir: string;
  readonly logoPublicPrefix: string;
}

export interface ScrapedProfile {
  readonly positions: Position[];
  readonly education: Education[];
}

export class LinkedInProfileScraper {
  static readonly SETTLE_MS = 6_000;
  static readonly DIALOG_TIMEOUT_MS = 8_000;
  static readonly BETWEEN_CLICKS_MS = 2_000;

  constructor(private readonly options: ProfileScraperOptions) {}

  async scrape(): Promise<ScrapedProfile> {
    const context = await LinkedInBrowser.launch(this.options.profileDir);
    try {
      const page = await LinkedInBrowser.firstPage(context);
      const experience = await this.readSection(page, 'experience');
      const withSkills = await LinkedInProfileScraper.addSkills(page, experience);
      const positions = await this.toPositionsWithLogos(context, withSkills);
      const education = await this.readSection(page, 'education');
      return {
        positions,
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

  /** Each role's skills open in a dialog from its "Skills" link; read it, close it, and pause before the next one. */
  private static async addSkills(page: Page, entries: readonly RawProfileEntry[]): Promise<RawProfileEntry[]> {
    const result: RawProfileEntry[] = [];
    for (const entry of entries) {
      const link = entry.formId ? page.locator(`a[href*="/overlay/${entry.formId}/skill-associations-details/"]`).first() : null;
      if (!link || (await link.count()) === 0) {
        result.push(entry);
        continue;
      }
      const skills = await LinkedInProfileScraper.readSkillsDialog(page, link);
      result.push({ ...entry, skills });
      await page.waitForTimeout(LinkedInProfileScraper.BETWEEN_CLICKS_MS);
    }
    const withSkills = result.filter((entry) => (entry.skills?.length ?? 0) > 0).length;
    console.log(`Read skills for ${withSkills} of ${entries.length} roles.`);
    return result;
  }

  private static async readSkillsDialog(page: Page, link: ReturnType<Page['locator']>): Promise<string[]> {
    try {
      await link.click();
      const dialog = page.locator('dialog').filter({ hasText: /Skills for / }).filter({ hasText: /Learn more about these skills/ }).first();
      await dialog.waitFor({ state: 'visible', timeout: LinkedInProfileScraper.DIALOG_TIMEOUT_MS });
      const skills = parseSkillsDialog(await dialog.innerText());
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden', timeout: LinkedInProfileScraper.DIALOG_TIMEOUT_MS }).catch(() => undefined);
      return skills;
    } catch (err) {
      console.warn(`Could not read a skills list: ${err instanceof Error ? err.message : String(err)}`);
      await page.keyboard.press('Escape').catch(() => undefined);
      return [];
    }
  }

  private async toPositionsWithLogos(context: BrowserContext, entries: readonly RawProfileEntry[]): Promise<Position[]> {
    await mkdir(this.options.logoDir, { recursive: true });
    const existing = await readdir(this.options.logoDir);
    const downloader = new LinkedInMediaDownloader(context.request, {
      outputDir: this.options.logoDir,
      publicPrefix: this.options.logoPublicPrefix,
      maxImagesPerPost: 0,
      maxVideoBytes: 0,
    });
    const logos = new Map<string, string | null>();
    const positions: Position[] = [];
    for (const entry of entries) {
      const position = toPosition(entry);
      if (!position) {
        continue;
      }
      const slug = slugify(position.company);
      if (entry.logoUrl && !logos.has(slug)) {
        logos.set(slug, await downloader.saveFile(entry.logoUrl, slug, existing, null));
      }
      positions.push({ ...position, companyLogo: logos.get(slug) ?? null });
    }
    return positions;
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
      const logoNear = (anchor: Element, groupContainer: Element | null): string | null => {
        let node: Element | null = anchor.parentElement;
        while (node) {
          if (!groupContainer && formsIn(node) > 1) {
            return null;
          }
          const img = node.querySelector('img[alt$=" logo"]');
          if (img) {
            return img.getAttribute('src');
          }
          if (node === groupContainer) {
            return null;
          }
          node = node.parentElement;
        }
        return null;
      };
      return [...uniqueAnchors.entries()].map(([href, anchor]) => {
        const item = anchor.closest('li') ?? anchor.parentElement ?? anchor;
        let group: Element | null = item.parentElement;
        while (group && formsIn(group) < 2) {
          group = group.parentElement;
        }
        const container = group?.parentElement ?? null;
        const isCompanyGroup = !!group && formsIn(group) < formsIn(document.body);
        const headerPs = container && isCompanyGroup ? [...container.querySelectorAll('p')].filter((p) => !group?.contains(p) && !p.closest(editSelector)) : [];
        return {
          lines: [...anchor.querySelectorAll('p')].map((p) => clean(p.textContent)).filter(Boolean),
          groupHeader: headerPs[0] ? clean(headerPs[0].textContent) : null,
          groupDetail: headerPs[1] ? clean(headerPs[1].textContent) : null,
          rest: (item as HTMLElement).innerText ?? '',
          formId: href.match(/\/forms\/(\d+)\//)?.[1] ?? null,
          logoUrl: logoNear(anchor, isCompanyGroup ? container : null),
          skills: [],
        };
      });
    }, section);
  }
}
