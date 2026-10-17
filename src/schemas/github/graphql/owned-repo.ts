import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';
import { LanguageEdge } from './language-edge.ts';

@ZodObject()
export class OwnedRepo extends ZodDto {
  @ZodField(z.number().int())
  stargazerCount!: number;

  @ZodField(z.object({ edges: z.array(LanguageEdge.schema) }))
  languages!: { edges: LanguageEdge[] };
}
