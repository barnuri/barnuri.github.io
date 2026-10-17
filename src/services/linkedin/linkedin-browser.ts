import { chmod, mkdir } from 'node:fs/promises';
import { type BrowserContext, chromium, type Page } from 'playwright';
import { PLAYWRIGHT_MOCK_KEYCHAIN_FLAG } from '../../consts/linkedin-api.ts';
import { exportPageState } from './export-page.ts';

export class LinkedInBrowser {
  static readonly LOGIN_TIMEOUT_MS = 10 * 60_000;
  static readonly STATE_CHECK_MS = 2_000;
  static readonly NAVIGATION_TIMEOUT_MS = 60_000;
  static readonly PROFILE_DIR_MODE = 0o700;

  /** Cookies are encrypted with the macOS Keychain because Playwright's mock keychain is turned off. */
  static async launch(profileDir: string): Promise<BrowserContext> {
    await mkdir(profileDir, { recursive: true, mode: LinkedInBrowser.PROFILE_DIR_MODE });
    await chmod(profileDir, LinkedInBrowser.PROFILE_DIR_MODE);
    return chromium.launchPersistentContext(profileDir, {
      headless: false,
      acceptDownloads: true,
      ignoreDefaultArgs: [PLAYWRIGHT_MOCK_KEYCHAIN_FLAG],
    });
  }

  static async firstPage(context: BrowserContext): Promise<Page> {
    return context.pages()[0] ?? (await context.newPage());
  }

  static async openWithLogin(page: Page, url: string, isTarget: (url: string) => boolean): Promise<void> {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: LinkedInBrowser.NAVIGATION_TIMEOUT_MS });
    const deadline = Date.now() + LinkedInBrowser.LOGIN_TIMEOUT_MS;
    let askedToLogIn = false;
    while (!isTarget(page.url())) {
      if (Date.now() > deadline) {
        throw new Error('Timed out after 10 minutes waiting for the LinkedIn login.');
      }
      const state = exportPageState(page.url());
      if (state === 'login' && !askedToLogIn) {
        console.log('Log in to LinkedIn in the browser window. The script continues after you log in.');
        askedToLogIn = true;
      }
      if (state === 'other' && askedToLogIn) {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: LinkedInBrowser.NAVIGATION_TIMEOUT_MS });
      }
      await page.waitForTimeout(LinkedInBrowser.STATE_CHECK_MS);
    }
  }

  static async close(context: BrowserContext): Promise<void> {
    await context.close().catch((err: unknown) => {
      console.warn(`Could not close the browser: ${err instanceof Error ? err.message : String(err)}`);
    });
  }
}
