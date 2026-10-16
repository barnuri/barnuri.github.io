import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { ContributionCalendar } from './contribution-calendar.ts';

@ZodObject()
export class ProfileContributions extends ZodDto {
  @ZodField(ContributionCalendar)
  contributionCalendar!: ContributionCalendar;
}
