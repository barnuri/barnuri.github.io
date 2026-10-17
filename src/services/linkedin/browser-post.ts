import { postUrl } from '../../consts/linkedin-api.ts';
import type { LinkedInPost } from '../../schemas/linkedin/linkedin-post.ts';
import type { MediaItem } from '../../schemas/linkedin/media-item.ts';

export interface RawBrowserPost {
  readonly activityId: string;
  readonly text: string;
  readonly reactionsText: string | null;
  readonly commentsText: string | null;
  readonly repostsText: string | null;
  readonly mediaKinds: readonly string[];
  readonly articleUrl: string | null;
}

const SNOWFLAKE_TIMESTAMP_SHIFT = 22n;
const ACTIVITY_ID = /^\d{10,25}$/;
const LEADING_COUNT = /^\s*([\d,]+)/;
const COUNT_BEFORE_WORD = /([\d,]+)\s+(comment|repost)/i;

export function activityIdToDate(activityId: string): string | null {
  if (!ACTIVITY_ID.test(activityId)) {
    return null;
  }
  const millis = Number(BigInt(activityId) >> SNOWFLAKE_TIMESTAMP_SHIFT);
  return Number.isFinite(millis) && millis > 0 ? new Date(millis).toISOString() : null;
}

export function parseCount(text: string | null, pattern: RegExp = LEADING_COUNT): number | null {
  const match = text?.match(pattern);
  return match?.[1] ? Number(match[1].replaceAll(',', '')) : null;
}

export function toBrowserPost(raw: RawBrowserPost): LinkedInPost {
  const urn = `urn:li:activity:${raw.activityId}`;
  const media: MediaItem[] = raw.mediaKinds.map((kind) => ({ kind, urn: null, url: null, title: null }));
  if (raw.articleUrl) {
    media.push({ kind: 'article', urn: null, url: raw.articleUrl, title: null });
  }
  return {
    id: urn,
    text: raw.text.trim(),
    published_at: activityIdToDate(raw.activityId),
    url: postUrl(urn),
    visibility: null,
    media,
    engagement: {
      likes: parseCount(raw.reactionsText),
      comments: parseCount(raw.commentsText, COUNT_BEFORE_WORD),
      shares: parseCount(raw.repostsText, COUNT_BEFORE_WORD),
    },
  };
}
