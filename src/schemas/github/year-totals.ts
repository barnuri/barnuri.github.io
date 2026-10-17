import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';

@ZodObject({ description: 'Public contribution totals for the last 12 months.' })
export class YearTotals extends ZodDto {
  static readonly EMPTY: YearTotals = { commits: 0, pullRequests: 0, reviews: 0, issues: 0, reposCreated: 0, contributedRepos: 0 };

  @ZodField(z.number().int().nonnegative())
  commits!: number;

  @ZodField(z.number().int().nonnegative())
  pullRequests!: number;

  @ZodField(z.number().int().nonnegative())
  reviews!: number;

  @ZodField(z.number().int().nonnegative())
  issues!: number;

  @ZodField(z.number().int().nonnegative())
  reposCreated!: number;

  @ZodField(z.number().int().nonnegative(), { description: 'Repositories with commits from you.' })
  contributedRepos!: number;
}
