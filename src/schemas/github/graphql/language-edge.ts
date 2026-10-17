import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';
import { PrimaryLanguage } from './primary-language.ts';

@ZodObject()
export class LanguageEdge extends ZodDto {
  @ZodField(z.number().int().nonnegative(), { description: 'Bytes of code in this language.' })
  size!: number;

  @ZodField(PrimaryLanguage)
  node!: PrimaryLanguage;
}
