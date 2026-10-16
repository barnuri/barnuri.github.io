import { z } from 'zod';

export const introspectionResponseSchema = z.object({
  active: z.boolean(),
  status: z.string().optional(),
  scope: z.string().optional(),
  expires_at: z.number().optional(),
});

export const tokenInfoSchema = introspectionResponseSchema.transform((response) => ({
  active: response.active,
  status: response.status ?? null,
  scopes: (response.scope ?? '')
    .split(',')
    .map((scope) => scope.trim())
    .filter(Boolean),
  expiresAt: response.expires_at ? new Date(response.expires_at * 1000) : null,
}));

export type TokenInfo = z.infer<typeof tokenInfoSchema>;
