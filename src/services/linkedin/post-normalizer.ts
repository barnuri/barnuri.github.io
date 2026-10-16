import { postUrl } from '../../consts/linkedin-api.ts';
import { type Engagement, UNKNOWN_ENGAGEMENT } from '../../schemas/linkedin/engagement.ts';
import type { LinkedInPost } from '../../schemas/linkedin/linkedin-post.ts';
import type { MediaItem } from '../../schemas/linkedin/media-item.ts';
import type { JsonObject } from './linkedin-client.ts';

const HASHTAG_TEMPLATE = /\{hashtag\|\\?#\|([^}]*)\}/g;
const MENTION_TEMPLATE = /@\[([^\]]*)\]\([^)]*\)/g;
const ESCAPED_RESERVED_CHARACTER = /\\([|{}@[\]()<>#\\*_~])/g;

const asObject = (value: unknown): JsonObject => (value && typeof value === 'object' ? (value as JsonObject) : {});
const asString = (value: unknown): string | null => (typeof value === 'string' ? value : null);
const asNumber = (value: unknown): number | null => (typeof value === 'number' ? value : null);

export function cleanCommentary(commentary: string | null): string {
  if (!commentary) {
    return '';
  }
  return commentary
    .replace(HASHTAG_TEMPLATE, (_, tag: string) => `#${tag}`)
    .replace(MENTION_TEMPLATE, (_, name: string) => name)
    .replace(ESCAPED_RESERVED_CHARACTER, (_, character: string) => character);
}

export function fromEpochMillis(value: number | null): string | null {
  return value === null ? null : new Date(value).toISOString();
}

export function mediaKind(urn: string | null): string {
  return urn?.split(':')[2] ?? 'media';
}

const mediaItem = (kind: string, fields: Partial<Omit<MediaItem, 'kind'>> = {}): MediaItem => ({
  kind,
  urn: fields.urn ?? null,
  url: fields.url ?? null,
  title: fields.title ?? null,
});

export function extractMedia(post: JsonObject): MediaItem[] {
  const content = asObject(post.content);
  const items: MediaItem[] = [];

  const media = asObject(content.media);
  if (content.media) {
    const urn = asString(media.id);
    items.push(mediaItem(mediaKind(urn), { urn, title: asString(media.title) }));
  }
  const article = asObject(content.article);
  if (content.article) {
    items.push(mediaItem('article', { url: asString(article.source), title: asString(article.title) }));
  }
  const images = asObject(content.multiImage).images;
  if (Array.isArray(images)) {
    items.push(...images.map((image) => mediaItem('image', { urn: asString(asObject(image).id) })));
  }
  if (content.poll) {
    items.push(mediaItem('poll', { title: asString(asObject(content.poll).question) }));
  }
  const parent = asString(asObject(post.reshareContext).parent);
  if (parent) {
    items.push(mediaItem('reshare', { urn: parent, url: postUrl(parent) }));
  }
  return items;
}

export function toEngagement(socialActions: JsonObject): Engagement {
  return {
    likes: asNumber(asObject(socialActions.likesSummary).totalLikes) ?? 0,
    comments: asNumber(asObject(socialActions.commentsSummary).aggregatedTotalComments) ?? 0,
    shares: null,
  };
}

export function normalizePost(post: JsonObject, engagement: Engagement = UNKNOWN_ENGAGEMENT): LinkedInPost {
  const urn = asString(post.id);
  if (!urn) {
    throw new Error('LinkedIn returned a post without an id.');
  }
  return {
    id: urn,
    text: cleanCommentary(asString(post.commentary)),
    published_at: fromEpochMillis(asNumber(post.publishedAt) ?? asNumber(post.createdAt)),
    url: postUrl(urn),
    visibility: asString(post.visibility),
    media: extractMedia(post),
    engagement,
  };
}
