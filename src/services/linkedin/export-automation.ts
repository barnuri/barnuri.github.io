import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import type { BrowserContext, Download, Frame, Locator, Page } from 'playwright';
import {
  EXPORT_CATEGORY_LABELS,
  EXPORT_FORM_TEXT,
  EXPORT_PAGE_URL,
  EXPORT_RADIO_IDS,
  EXPORT_REQUIRED_LABELS,
} from '../../consts/linkedin-api.ts';
import { archiveFileName, exportPageState } from './export-page.ts';
import { LinkedInBrowser } from './linkedin-browser.ts';

export interface ExportAutomationOptions {
  readonly importDir: string;
  readonly waitMinutes: number;
  readonly fullArchive: boolean;
  readonly profileDir: string;
}

type Root = Page | Frame;

export class LinkedInExportAutomation {
  static readonly PASSWORD_TIMEOUT_MS = 10 * 60_000;
  static readonly DOWNLOAD_TIMEOUT_MS = 10 * 60_000;
  static readonly FORM_TIMEOUT_MS = 30_000;
  static readonly POLL_INTERVAL_MS = 60_000;
  static readonly STATE_CHECK_MS = 2_000;
  static readonly CLICK_TIMEOUT_MS = 5_000;
  static readonly MANUAL_STEP_MS = 3 * 60_000;
  static readonly PAGE_DUMP_FILE = 'last-page.txt';
  static readonly SETTLE_MS = 1_500;
  static readonly FILE_GROUP_PREFIX = 'file_group_';
  static readonly DOWNLOAD_NAME = /download archive/i;

  private savedArchive: Promise<string> | null = null;

  constructor(
    private readonly options: ExportAutomationOptions,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async run(): Promise<string | null> {
    await mkdir(this.options.importDir, { recursive: true });
    const context = await LinkedInBrowser.launch(this.options.profileDir);
    this.saveEveryDownload(context);
    try {
      const page = await LinkedInBrowser.firstPage(context);
      await LinkedInBrowser.openWithLogin(page, EXPORT_PAGE_URL, (url) => exportPageState(url) === 'export');
      console.log('Opened the LinkedIn "Download your data" page.');
      const form = await this.findForm(page);
      if (await this.isDownloadReady(form)) {
        return await this.download(form);
      }
      await this.requestArchive(page, form);
      return await this.waitForArchive(page);
    } finally {
      await LinkedInBrowser.close(context);
    }
  }

  private saveEveryDownload(context: BrowserContext): void {
    const save = async (download: Download): Promise<string> => {
      const path = join(this.options.importDir, archiveFileName(download.suggestedFilename(), this.now()));
      await download.saveAs(path);
      console.log(`Saved the archive to ${path}.`);
      return path;
    };
    context.on('page', (page) => page.on('download', (download) => (this.savedArchive ??= save(download))));
    for (const page of context.pages()) {
      page.on('download', (download) => (this.savedArchive ??= save(download)));
    }
  }

  /** LinkedIn renders the export form inside an embedded frame, so search every frame for it. */
  private async findForm(page: Page): Promise<Root> {
    const deadline = Date.now() + LinkedInExportAutomation.FORM_TIMEOUT_MS;
    while (Date.now() < deadline) {
      for (const frame of page.frames()) {
        const found = await frame
          .getByText(EXPORT_FORM_TEXT)
          .count()
          .catch(() => 0);
        if (found > 0) {
          return frame;
        }
      }
      await page.waitForTimeout(LinkedInExportAutomation.STATE_CHECK_MS);
    }
    console.warn('Could not find the export form in any frame. Falling back to the main page.');
    return page;
  }

  private downloadButton(root: Root): Locator {
    const name = LinkedInExportAutomation.DOWNLOAD_NAME;
    return root.getByRole('button', { name }).or(root.getByRole('link', { name })).first();
  }

  private async isDownloadReady(root: Root): Promise<boolean> {
    return this.downloadButton(root)
      .isVisible({ timeout: LinkedInExportAutomation.CLICK_TIMEOUT_MS })
      .catch(() => false);
  }

  private async requestArchive(page: Page, form: Root): Promise<void> {
    const selected = this.options.fullArchive ? await this.selectFullArchive(form) : await this.selectProfile(form);
    const requested = selected && (await LinkedInExportAutomation.tryClick(form.getByRole('button', { name: /request archive/i })));
    if (!requested) {
      await this.dumpPage(page, 'request archive');
      const what = this.options.fullArchive ? '"Download larger data archive"' : '"Want something in particular?" and check Profile and Articles';
      await LinkedInExportAutomation.waitForEnter(
        `Could not complete the request automatically. In the browser window, select ${what}, click "Request archive", enter your password if LinkedIn asks, then press Enter here.`,
      );
      return;
    }
    console.log('Clicked "Request archive". If LinkedIn asks for your password, enter it in the browser window.');
    await LinkedInExportAutomation.waitForPasswordPrompt(form);
  }

  private async selectFullArchive(form: Root): Promise<boolean> {
    return (
      (await LinkedInExportAutomation.checkViaLabel(form, EXPORT_RADIO_IDS.full)) ||
      LinkedInExportAutomation.chooseRadio(form, /download larger data archive/i)
    );
  }

  private async selectProfile(form: Root): Promise<boolean> {
    const particular =
      (await LinkedInExportAutomation.checkViaLabel(form, EXPORT_RADIO_IDS.particular)) ||
      (await LinkedInExportAutomation.chooseRadio(form, /want something in particular/i));
    if (!particular) {
      return false;
    }
    for (const label of EXPORT_CATEGORY_LABELS) {
      const checked = await LinkedInExportAutomation.checkByLabel(form, label);
      const required = EXPORT_REQUIRED_LABELS.includes(label);
      if (!checked && required) {
        console.warn(`Could not check "${label.source}".`);
        return false;
      }
      if (!checked) {
        console.log(`Skipped "${label.source}": LinkedIn did not offer it or it could not be checked.`);
      }
    }
    return true;
  }

  private static async checkByLabel(form: Root, label: RegExp): Promise<boolean> {
    const labels = form.locator(`label[for^="${LinkedInExportAutomation.FILE_GROUP_PREFIX}"]`);
    const count = await labels.count().catch(() => 0);
    for (let index = 0; index < count; index++) {
      const text = (await labels.nth(index).textContent().catch(() => ''))?.trim() ?? '';
      const inputId = await labels.nth(index).getAttribute('for').catch(() => null);
      if (label.test(text) && inputId && (await LinkedInExportAutomation.checkViaLabel(form, inputId))) {
        return true;
      }
    }
    return false;
  }

  private static async chooseRadio(form: Root, name: RegExp): Promise<boolean> {
    const checked = await form
      .getByRole('radio', { name })
      .first()
      .check({ timeout: LinkedInExportAutomation.CLICK_TIMEOUT_MS })
      .then(() => true)
      .catch(() => false);
    return checked || LinkedInExportAutomation.tryClick(form.getByText(name).first());
  }

  /** LinkedIn hides the inputs behind styled labels and re-renders the list after each choice, so click the label and let it settle. */
  private static async checkViaLabel(form: Root, inputId: string): Promise<boolean> {
    const input = form.locator(`[id="${inputId}"]`);
    if ((await input.count().catch(() => 0)) === 0) {
      return false;
    }
    if (!(await LinkedInExportAutomation.isChecked(input))) {
      await LinkedInExportAutomation.tryClick(form.locator(`label[for="${inputId}"]`).first());
      await Bun.sleep(LinkedInExportAutomation.SETTLE_MS);
    }
    return LinkedInExportAutomation.isChecked(input);
  }

  private static async isChecked(checkbox: Locator): Promise<boolean> {
    return checkbox.isChecked({ timeout: LinkedInExportAutomation.CLICK_TIMEOUT_MS }).catch(() => false);
  }

  private async dumpPage(page: Page, step: string): Promise<void> {
    const path = join(this.options.profileDir, LinkedInExportAutomation.PAGE_DUMP_FILE);
    const outlines = await Promise.all(
      page.frames().map(async (frame) => {
        const outline = await frame
          .locator('body')
          .ariaSnapshot()
          .catch((err: unknown) => `Could not read this frame: ${err instanceof Error ? err.message : String(err)}`);
        return `--- frame ${frame.url()}\n${outline}`;
      }),
    );
    await Bun.write(path, `Step: ${step}\nURL: ${page.url()}\n\n${outlines.join('\n\n')}\n`);
    console.log(`Saved the page outline to ${path} so the selectors can be fixed.`);
  }

  private async waitForArchive(page: Page): Promise<string | null> {
    const deadline = Date.now() + this.options.waitMinutes * 60_000;
    console.log(`Waiting up to ${this.options.waitMinutes} minutes for LinkedIn to prepare the archive. Keep the window open.`);
    while (Date.now() < deadline) {
      await page.waitForTimeout(LinkedInExportAutomation.POLL_INTERVAL_MS);
      if (this.savedArchive) {
        return this.savedArchive;
      }
      await page.reload({ waitUntil: 'domcontentloaded' });
      const form = await this.findForm(page);
      if (await this.isDownloadReady(form)) {
        return this.download(form);
      }
    }
    console.log(
      'The archive is not ready yet. LinkedIn emails you when it is. Run "bun run linkedin export --force" again then, or put the zip from the email in imports/linkedin/.',
    );
    return null;
  }

  private async download(form: Root): Promise<string> {
    if (await LinkedInExportAutomation.tryClick(this.downloadButton(form))) {
      console.log('Clicked "Download archive". If LinkedIn asks for your password, enter it in the browser window.');
    } else {
      console.log('Click "Download archive" in the browser window. The script saves the file when the download starts.');
    }
    const deadline = Date.now() + LinkedInExportAutomation.DOWNLOAD_TIMEOUT_MS;
    while (!this.savedArchive) {
      if (Date.now() > deadline) {
        throw new Error('No download started within 10 minutes.');
      }
      await Bun.sleep(LinkedInExportAutomation.STATE_CHECK_MS);
    }
    return this.savedArchive;
  }

  private static async tryClick(locator: Locator): Promise<boolean> {
    return locator
      .click({ timeout: LinkedInExportAutomation.CLICK_TIMEOUT_MS })
      .then(() => true)
      .catch(() => false);
  }

  private static async waitForPasswordPrompt(root: Root): Promise<void> {
    const password = root.locator('input[type="password"]').first();
    const prompted = await password.isVisible({ timeout: LinkedInExportAutomation.CLICK_TIMEOUT_MS }).catch(() => false);
    if (prompted) {
      await password.waitFor({ state: 'hidden', timeout: LinkedInExportAutomation.PASSWORD_TIMEOUT_MS });
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

}
