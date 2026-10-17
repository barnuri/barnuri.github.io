import { postUrl } from '../../consts/linkedin-api.ts';
import type { LinkedInPost } from '../../schemas/linkedin/linkedin-post.ts';
import type { MediaItem } from '../../schemas/linkedin/media-item.ts';

export interface RawVideo {
  readonly src: string | null;
  readonly poster: string | null;
}

export interface RawBrowserPost {
  readonly activityId: string;
  readonly text: string;
  readonly reactionsText: string | null;
  readonly commentsText: string | null;
  readonly repostsText: string | null;
  readonly imageUrls: readonly string[];
  readonly video: RawVideo | null;
  readonly hasDocument: boolean;
  readonly articleUrl: string | null;
}

export interface LocalMedia {
  readonly images: readonly string[];
  readonly video: RawVideo | null;
}

const SNOWFLAKE_TIMESTAMP_SHIFT = 22n;
const ACTIVITY_ID = /^\d{10,25}$/;
const LEADING_COUNT = /^\s*([\d,]+)/;
const COUNT_BEFORE_WORD = /([\d,]+)\s+(comment|repost)/i;
const HIDDEN_HASHTAG_LABEL = /\bhashtag\s+(?=#)/gi;
const NO_LOCAL_MEDIA: LocalMedia = { images: [], video: null };

export function cleanPostText(text: string): string {
  return text.replace(HIDDEN_HASHTAG_LABEL, '').trim();
}

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

/** Prefers the record that has more media, because LinkedIn loads images only as they scroll into view. */
export function richerPost(current: RawBrowserPost, next: RawBrowserPost): RawBrowserPost {
  const score = (post: RawBrowserPost): number => post.imageUrls.length + (post.video?.src ? 2 : post.video?.poster ? 1 : 0);
  return score(next) > score(current) ? next : current;
}

const mediaItem = (kind: string, url: string | null, poster: string | null = null): MediaItem => ({
  kind,
  urn: null,
  url,
  title: null,
  poster,
});

export function toBrowserPost(raw: RawBrowserPost, local: LocalMedia = NO_LOCAL_MEDIA): LinkedInPost {
  const urn = `urn:li:activity:${raw.activityId}`;
  const media: MediaItem[] = local.images.map((path) => mediaItem('image', path));
  if (raw.video) {
    media.push(mediaItem('video', local.video?.src ?? null, local.video?.poster ?? null));
  }
  if (raw.hasDocument) {
    media.push(mediaItem('document', null));
  }
  if (raw.articleUrl) {
    media.push(mediaItem('article', raw.articleUrl));
  }
  return {
    id: urn,
    text: cleanPostText(raw.text),
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
