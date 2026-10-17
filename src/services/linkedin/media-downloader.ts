import { mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { APIRequestContext } from 'playwright';
import type { LocalMedia, RawBrowserPost } from './browser-post.ts';

export interface MediaDownloaderOptions {
  readonly outputDir: string;
  readonly publicPrefix: string;
  readonly maxImagesPerPost: number;
  readonly maxVideoBytes: number;
}

export class LinkedInMediaDownloader {
  static readonly ALLOWED_HOST = /(^|\.)licdn\.com$/i;
  static readonly EXTENSIONS: Readonly<Record<string, string>> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
  };

  constructor(
    private readonly request: APIRequestContext,
    private readonly options: MediaDownloaderOptions,
  ) {}

  async download(post: RawBrowserPost): Promise<LocalMedia> {
    await mkdir(this.options.outputDir, { recursive: true });
    const existing = await readdir(this.options.outputDir);
    const images: string[] = [];
    for (const [index, url] of post.imageUrls.slice(0, this.options.maxImagesPerPost).entries()) {
      const saved = await this.save(url, `${post.activityId}-${index + 1}`, existing, null);
      if (saved) {
        images.push(saved);
      }
    }
    if (!post.video) {
      return { images, video: null };
    }
    const poster = post.video.poster ? await this.save(post.video.poster, `${post.activityId}-poster`, existing, null) : null;
    const src = post.video.src ? await this.save(post.video.src, `${post.activityId}-video`, existing, this.options.maxVideoBytes) : null;
    return { images, video: { src, poster } };
  }

  /** Reuses a file saved by an earlier run, so the repo keeps stable file names and skips re-downloads. */
  private async save(url: string, baseName: string, existing: readonly string[], maxBytes: number | null): Promise<string | null> {
    const already = existing.find((name) => name.startsWith(`${baseName}.`));
    if (already) {
      return `${this.options.publicPrefix}/${already}`;
    }
    if (!LinkedInMediaDownloader.isLinkedInUrl(url)) {
      console.warn(`Skipped media from an unexpected host for ${baseName}.`);
      return null;
    }
    try {
      const response = await this.request.get(url);
      if (!response.ok()) {
        console.warn(`Could not download ${baseName}: status ${response.status()}.`);
        return null;
      }
      const type = (response.headers()['content-type'] ?? '').split(';')[0]?.trim() ?? '';
      const extension = LinkedInMediaDownloader.EXTENSIONS[type];
      if (!extension) {
        console.warn(`Skipped ${baseName}: unexpected content type "${type}".`);
        return null;
      }
      const body = await response.body();
      if (maxBytes !== null && body.byteLength > maxBytes) {
        console.warn(`Skipped ${baseName}: ${Math.round(body.byteLength / 1_048_576)} MB is over the size limit. It links to LinkedIn instead.`);
        return null;
      }
      const fileName = `${baseName}.${extension}`;
      await Bun.write(join(this.options.outputDir, fileName), body);
      return `${this.options.publicPrefix}/${fileName}`;
    } catch (err) {
      console.warn(`Could not download ${baseName}: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }

  static isLinkedInUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' && LinkedInMediaDownloader.ALLOWED_HOST.test(parsed.hostname);
    } catch {
      return false;
    }
  }
}
