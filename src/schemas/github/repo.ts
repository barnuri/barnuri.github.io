import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';

@ZodObject({ description: 'A public repository shown on the page.' })
export class Repo extends ZodDto {
  @ZodField(z.string())
  name!: string;

  @ZodField(z.string())
  description!: string;

  @ZodField(z.url())
  url!: string;

  @ZodField(z.number().int().nonnegative())
  stars!: number;

  @ZodField(z.string().nullable())
  language!: string | null;

  @ZodField(z.string().nullable())
  languageColor!: string | null;

  @ZodField(z.string())
  pushedAt!: string;
}
