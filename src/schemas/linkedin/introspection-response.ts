import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';

@ZodObject({ description: 'LinkedIn token introspection response.' })
export class IntrospectionResponse extends ZodDto {
  @ZodField(z.boolean())
  active!: boolean;

  @ZodField(z.string().optional(), { description: 'active, expired or revoked.' })
  status?: string;

  @ZodField(z.string().optional(), { description: 'Comma-separated scopes, 3-legged tokens only.' })
  scope?: string;

  @ZodField(z.number().optional(), { description: 'Epoch seconds.' })
  expires_at?: number;
}
