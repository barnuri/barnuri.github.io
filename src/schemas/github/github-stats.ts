import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';
import { LanguageShare } from './language-share.ts';
import { YearTotals } from './year-totals.ts';

@ZodObject({ description: 'Totals shown on the Home and Projects pages.' })
export class GitHubStats extends ZodDto {
  static readonly EMPTY: GitHubStats = { publicRepos: 0, stars: 0, followers: 0, languages: [], year: YearTotals.EMPTY };

  @ZodField(z.number().int().nonnegative(), { description: 'Public, non-fork repositories you own.' })
  publicRepos!: number;

  @ZodField(z.number().int().nonnegative())
  stars!: number;

  @ZodField(z.number().int().nonnegative())
  followers!: number;

  @ZodField([LanguageShare], { description: 'Largest first.' })
  languages!: LanguageShare[];

  @ZodField(YearTotals)
  year!: YearTotals;
}
