import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { type Browser, chromium, type Locator, type Page } from 'playwright';
import { EXPORT_CATEGORY_LABELS, EXPORT_PAGE_URL } from '../../consts/linkedin-api.ts';
import { archiveFileName, exportPageState } from './export-page.ts';

export interface ExportAutomationOptions {
  readonly importDir: string;
  readonly waitMinutes: number;
  readonly fullArchive: boolean;
}

export class LinkedInExportAutomation {
  static readonly LOGIN_TIMEOUT_MS = 10 * 60_000;
  static readonly DOWNLOAD_TIMEOUT_MS = 10 * 60_000;
  static readonly POLL_INTERVAL_MS = 60_000;
  static readonly STATE_CHECK_MS = 2_000;
  static readonly CLICK_TIMEOUT_MS = 5_000;
  static readonly MANUAL_STEP_MS = 3 * 60_000;

  constructor(
    private readonly options: ExportAutomationOptions,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async run(): Promise<string | null> {
    const browser = await chromium.launch({ headless: false });
    try {
      const page = await (await browser.newContext({ acceptDownloads: true })).newPage();
      await this.openExportPage(page);
      if (await this.isDownloadReady(page)) {
        return await this.download(page);
      }
      await this.requestArchive(page);
      return await this.waitForArchive(page);
    } finally {
      await LinkedInExportAutomation.close(browser);
    }
  }

  private async openExportPage(page: Page): Promise<void> {
    await page.goto(EXPORT_PAGE_URL);
    const deadline = Date.now() + LinkedInExportAutomation.LOGIN_TIMEOUT_MS;
    let askedToLogIn = false;
    while (exportPageState(page.url()) !== 'export') {
      if (Date.now() > deadline) {
        throw new Error('Timed out after 10 minutes waiting for the LinkedIn login.');
      }
      const state = exportPageState(page.url());
      if (state === 'login' && !askedToLogIn) {
        console.log('Log in to LinkedIn in the browser window. The script continues after you log in.');
        askedToLogIn = true;
      }
      if (state === 'other' && askedToLogIn) {
        await page.goto(EXPORT_PAGE_URL);
      }
      await page.waitForTimeout(LinkedInExportAutomation.STATE_CHECK_MS);
    }
    await page.waitForLoadState('domcontentloaded');
    console.log('Opened the LinkedIn "Download your data" page.');
  }

  private downloadButton(page: Page): Locator {
    const name = /download archive/i;
    return page.getByRole('button', { name }).or(page.getByRole('link', { name })).first();
  }

  private async isDownloadReady(page: Page): Promise<boolean> {
    return this.downloadButton(page)
      .isVisible({ timeout: LinkedInExportAutomation.CLICK_TIMEOUT_MS })
      .catch(() => false);
  }

  private async requestArchive(page: Page): Promise<void> {
    const selected = this.options.fullArchive ? await this.selectFullArchive(page) : await this.selectCategories(page);
    const requested = selected && (await LinkedInExportAutomation.tryClick(page.getByRole('button', { name: /request archive/i })));
    if (!requested) {
      const what = this.options.fullArchive
        ? 'the larger data archive'
        : '"Want something in particular?" with Profile, Positions, Education and Shares';
      await LinkedInExportAutomation.waitForEnter(
        `Could not complete the request automatically. In the browser window, select ${what}, click "Request archive", enter your password if LinkedIn asks, then press Enter here.`,
      );
      return;
    }
    console.log('Clicked "Request archive". If LinkedIn asks for your password, enter it in the browser window.');
    await LinkedInExportAutomation.waitForPasswordPrompt(page);
  }

  private async selectFullArchive(page: Page): Promise<boolean> {
    return LinkedInExportAutomation.tryClick(page.getByRole('radio', { name: /larger data archive/i }).or(page.getByText(/larger data archive/i)).first());
  }

  private async selectCategories(page: Page): Promise<boolean> {
    const particular = page.getByRole('radio', { name: /want something in particular/i }).or(page.getByText(/want something in particular/i)).first();
    if (!(await LinkedInExportAutomation.tryClick(particular))) {
      return false;
    }
    let checkedAll = true;
    for (const label of EXPORT_CATEGORY_LABELS) {
      const checkbox = page.getByRole('checkbox', { name: label }).first();
      const checked = await checkbox
        .check({ timeout: LinkedInExportAutomation.CLICK_TIMEOUT_MS })
        .then(() => true)
        .catch(() => false);
      if (!checked) {
        console.warn(`Could not find the "${label.source}" checkbox. Check it in the browser window if LinkedIn lists it.`);
        checkedAll = false;
      }
    }
    if (!checkedAll) {
      await LinkedInExportAutomation.waitForEnter('Check the missing categories in the browser window, then press Enter here.');
    }
    return true;
  }

  private async waitForArchive(page: Page): Promise<string | null> {
    const deadline = Date.now() + this.options.waitMinutes * 60_000;
    console.log(`Waiting up to ${this.options.waitMinutes} minutes for LinkedIn to prepare the archive. Keep the window open.`);
    while (Date.now() < deadline) {
      await page.waitForTimeout(LinkedInExportAutomation.POLL_INTERVAL_MS);
      await page.reload({ waitUntil: 'domcontentloaded' });
      if (await this.isDownloadReady(page)) {
        return this.download(page);
      }
      console.log('Archive not ready yet.');
    }
    console.log(
      'The archive is not ready yet. LinkedIn emails you when it is: about 10 minutes for profile data, up to 48 hours for Shares. Run "bun run linkedin export" again then.',
    );
    return null;
  }

  private async download(page: Page): Promise<string> {
    await mkdir(this.options.importDir, { recursive: true });
    const downloadEvent = page.waitForEvent('download', { timeout: LinkedInExportAutomation.DOWNLOAD_TIMEOUT_MS });
    if (await LinkedInExportAutomation.tryClick(this.downloadButton(page))) {
      console.log('Clicked "Download archive". If LinkedIn asks for your password, enter it in the browser window.');
    } else {
      console.log('Click "Download archive" in the browser window. The script saves the file when the download starts.');
    }
    const download = await downloadEvent;
    const path = join(this.options.importDir, archiveFileName(download.suggestedFilename(), this.now()));
    await download.saveAs(path);
    console.log(`Saved the archive to ${path}.`);
    return path;
  }

  private static async tryClick(locator: Locator): Promise<boolean> {
    return locator
      .click({ timeout: LinkedInExportAutomation.CLICK_TIMEOUT_MS })
      .then(() => true)
      .catch(() => false);
  }

  private static async waitForPasswordPrompt(page: Page): Promise<void> {
    const password = page.locator('input[type="password"]').first();
    const prompted = await password.isVisible({ timeout: LinkedInExportAutomation.CLICK_TIMEOUT_MS }).catch(() => false);
    if (prompted) {
      await password.waitFor({ state: 'hidden', timeout: LinkedInExportAutomation.LOGIN_TIMEOUT_MS });
    }
  }

  private static async waitForEnter(message: string): Promise<void> {
    if (!process.stdin.isTTY) {
      console.log(`${message.replace(/, then press Enter here\.$/, '.')} The script continues in 3 minutes.`);
      await Bun.sleep(LinkedInExportAutomation.MANUAL_STEP_MS);
      return;
    }
    const prompt = createInterface({ input: process.stdin, output: process.stdout });
    try {
      await prompt.question(`${message}\n`);
    } finally {
      prompt.close();
    }
  }

  private static async close(browser: Browser): Promise<void> {
    await browser.close().catch((err: unknown) => {
      console.warn(`Could not close the browser: ${err instanceof Error ? err.message : String(err)}`);
    });
  }
}
