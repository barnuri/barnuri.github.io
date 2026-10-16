import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';

@ZodObject()
export class PrimaryLanguage extends ZodDto {
  @ZodField(z.string())
  name!: string;

  @ZodField(z.string().nullable())
  color!: string | null;
}
