import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';
import { ActivityItem } from './activity-item.ts';

@ZodObject({ description: 'Saved public activity history.' })
export class Activity extends ZodDto {
  static readonly EMPTY: Activity = { items: [], privateContributions: 0 };

  @ZodField([ActivityItem], { description: 'Newest first, capped at the store limit.' })
  items!: ActivityItem[];

  @ZodField(z.number().int().nonnegative(), { description: 'Contributions in private repositories, count only.' })
  privateContributions!: number;
}
