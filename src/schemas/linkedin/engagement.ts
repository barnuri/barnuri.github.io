import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';

@ZodObject({ description: 'Engagement counts, null when the token cannot read them.' })
export class Engagement extends ZodDto {
  static readonly UNKNOWN: Engagement = { likes: null, comments: null, shares: null };

  @ZodField(z.number().int().nullable().default(null))
  likes!: number | null;

  @ZodField(z.number().int().nullable().default(null))
  comments!: number | null;

  @ZodField(z.number().int().nullable().default(null), { description: 'Always null: the API reports no repost count.' })
  shares!: number | null;
}
