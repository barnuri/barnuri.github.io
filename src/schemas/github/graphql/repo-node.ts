import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';
import { PrimaryLanguage } from './primary-language.ts';

@ZodObject({ description: 'A repository as GitHub GraphQL returns it.' })
export class RepoNode extends ZodDto {
  @ZodField(z.string())
  name!: string;

  @ZodField(z.string().nullable())
  description!: string | null;

  @ZodField(z.url())
  url!: string;

  @ZodField(z.number().int())
  stargazerCount!: number;

  @ZodField(z.boolean())
  isFork!: boolean;

  @ZodField(z.boolean())
  isArchived!: boolean;

  @ZodField(z.string())
  pushedAt!: string;

  @ZodField(PrimaryLanguage.schema.nullable())
  primaryLanguage!: PrimaryLanguage | null;
}
