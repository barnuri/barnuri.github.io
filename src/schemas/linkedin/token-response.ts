import { z } from 'zod';

export const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int(),
  scope: z.string().optional(),
});

export type TokenResponse = z.infer<typeof tokenResponseSchema>;
