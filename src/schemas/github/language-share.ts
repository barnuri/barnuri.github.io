import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';

@ZodObject({ description: 'Share of code in one language across public repositories.' })
export class LanguageShare extends ZodDto {
  @ZodField(z.string())
  name!: string;

  @ZodField(z.string().nullable())
  color!: string | null;

  @ZodField(z.number().min(0).max(100), { description: 'Percent of bytes, rounded to one decimal.' })
  share!: number;
}
