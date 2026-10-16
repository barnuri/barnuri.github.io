import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';

@ZodObject({ description: 'LinkedIn OAuth access token response.' })
export class TokenResponse extends ZodDto {
  @ZodField(z.string().min(1))
  access_token!: string;

  @ZodField(z.number().int(), { description: 'Seconds until the token expires.' })
  expires_in!: number;

  @ZodField(z.string().optional())
  scope?: string;
}
