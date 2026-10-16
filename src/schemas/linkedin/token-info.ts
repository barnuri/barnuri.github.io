import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';
import type { IntrospectionResponse } from './introspection-response.ts';

@ZodObject({ description: 'Token state and scopes derived from introspection.' })
export class TokenInfo extends ZodDto {
  @ZodField(z.boolean())
  active!: boolean;

  @ZodField(z.string().nullable())
  status!: string | null;

  @ZodField(z.array(z.string()))
  scopes!: string[];

  @ZodField(z.date().nullable())
  expiresAt!: Date | null;

  static fromIntrospection(response: IntrospectionResponse): TokenInfo {
    return {
      active: response.active,
      status: response.status ?? null,
      scopes: (response.scope ?? '')
        .split(',')
        .map((scope) => scope.trim())
        .filter(Boolean),
      expiresAt: response.expires_at ? new Date(response.expires_at * 1000) : null,
    };
  }
}
