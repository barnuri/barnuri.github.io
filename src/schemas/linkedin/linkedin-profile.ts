import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';
import { Education } from './education.ts';
import { Position } from './position.ts';

@ZodObject({ description: 'Experience and education stored in data/linkedin_profile.json.' })
export class LinkedInProfile extends ZodDto {
  @ZodField(z.iso.datetime())
  imported_at!: string;

  @ZodField(z.string().nullable().default(null), { description: 'Headline from Profile.csv.' })
  headline!: string | null;

  @ZodField(z.string().nullable().default(null), { description: 'About text from Profile.csv.' })
  summary!: string | null;

  @ZodField([Position], { description: 'Most recent first, current roles at the top.' })
  positions!: Position[];

  @ZodField([Education])
  education!: Education[];
}
