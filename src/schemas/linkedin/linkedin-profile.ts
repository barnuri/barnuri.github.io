import { z } from 'zod';
import { educationSchema } from './education.ts';
import { positionSchema } from './position.ts';

export const linkedInProfileSchema = z.object({
  imported_at: z.iso.datetime(),
  positions: z.array(positionSchema),
  education: z.array(educationSchema),
});

export type LinkedInProfile = z.infer<typeof linkedInProfileSchema>;
