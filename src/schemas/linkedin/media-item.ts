import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';

@ZodObject({ description: 'Media attached to a LinkedIn post.' })
export class MediaItem extends ZodDto {
  @ZodField(z.string(), { description: 'image, video, document, article, poll or reshare.' })
  kind!: string;

  @ZodField(z.string().nullable().default(null))
  urn!: string | null;

  @ZodField(z.string().nullable().default(null), { description: 'Site path for downloaded media, or an external link.' })
  url!: string | null;

  @ZodField(z.string().nullable().default(null))
  title!: string | null;

  @ZodField(z.string().nullable().default(null), { description: 'Site path of the video preview frame.' })
  poster!: string | null;
}
