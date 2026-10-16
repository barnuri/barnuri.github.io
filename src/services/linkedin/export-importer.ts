import { ExportFormatError } from '../../errors/export-format-error.ts';
import { Engagement } from '../../schemas/linkedin/engagement.ts';
import type { LinkedInPost } from '../../schemas/linkedin/linkedin-post.ts';
import type { MediaItem } from '../../schemas/linkedin/media-item.ts';
import type { PostCollection } from '../../schemas/linkedin/post-collection.ts';
import { parseCsvRecords } from './csv.ts';

export class ExportImporter {
  static readonly REQUIRED_COLUMNS = ['Date', 'ShareLink', 'ShareCommentary'] as const;
  static readonly DATE_PATTERN = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/;
  static readonly UNAVAILABLE_FIELDS = ['engagement.likes', 'engagement.comments', 'engagement.shares'];

  constructor(private readonly now: () => Date = () => new Date()) {}

  async load(sharesCsvPath: string): Promise<PostCollection> {
    const file = Bun.file(sharesCsvPath);
    if (!(await file.exists())) {
      throw new ExportFormatError(`${sharesCsvPath} does not exist.`);
    }
    return this.parse(await file.text(), sharesCsvPath);
  }

  parse(text: string, sourceName: string): PostCollection {
    const { header, records } = parseCsvRecords(text);
    const missing = ExportImporter.REQUIRED_COLUMNS.filter((column) => !header.includes(column));
    if (missing.length > 0) {
      throw new ExportFormatError(
        `${sourceName} is missing columns ${missing.join(', ')}. Use Shares.csv from the LinkedIn data export.`,
      );
    }
    return {
      source: 'export',
      fetched_at: this.now().toISOString(),
      author_urn: null,
      posts: records.filter((record) => record.ShareLink?.trim()).map((record) => ExportImporter.toPost(record)),
      unavailable_fields: ExportImporter.UNAVAILABLE_FIELDS,
    };
  }

  private static toPost(record: Record<string, string>): LinkedInPost {
    const link = (record.ShareLink ?? '').trim();
    const media: MediaItem[] = [];
    const sharedUrl = record.SharedUrl?.trim();
    if (sharedUrl) {
      media.push({ kind: 'article', urn: null, url: sharedUrl, title: null });
    }
    const mediaUrl = record.MediaUrl?.trim();
    if (mediaUrl) {
      media.push({ kind: 'media', urn: null, url: mediaUrl, title: null });
    }
    return {
      id: ExportImporter.urnFromLink(link),
      text: (record.ShareCommentary ?? '').trim(),
      published_at: ExportImporter.parseDate(record.Date),
      url: link,
      visibility: record.Visibility?.trim() || null,
      media,
      engagement: Engagement.UNKNOWN,
    };
  }

  private static parseDate(value: string | undefined): string | null {
    const match = value?.trim().match(ExportImporter.DATE_PATTERN);
    if (!match) {
      return null;
    }
    const date = new Date(`${match[1]}T${match[2]}Z`);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  private static urnFromLink(link: string): string {
    const decoded = decodeURIComponent(link).replace(/\/+$/, '');
    const position = decoded.indexOf('urn:li:');
    return position >= 0 ? decoded.slice(position) : decoded;
  }
}
