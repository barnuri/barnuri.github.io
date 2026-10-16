import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';
import { Engagement } from './engagement.ts';
import { MediaItem } from './media-item.ts';

@ZodObject({ description: 'One LinkedIn post.' })
export class LinkedInPost extends ZodDto {
  @ZodField(z.string(), { description: 'Post URN.' })
  id!: string;

  @ZodField(z.string())
  text!: string;

  @ZodField(z.iso.datetime().nullable())
  published_at!: string | null;

  @ZodField(z.url())
  url!: string;

  @ZodField(z.string().nullable().default(null))
  visibility!: string | null;

  @ZodField(z.array(MediaItem.schema).default([]))
  media!: MediaItem[];

  @ZodField(Engagement)
  engagement!: Engagement;
}
