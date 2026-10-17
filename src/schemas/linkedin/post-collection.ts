import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { z } from 'zod';
import { POST_SOURCES } from '../../consts/linkedin-api.ts';
import { LinkedInPost } from './linkedin-post.ts';

@ZodObject({ description: 'LinkedIn posts stored in data/linkedin_posts.json.' })
export class PostCollection extends ZodDto {
  @ZodField(z.enum(POST_SOURCES), { description: 'api for the Posts API, export for the data archive, browser for the activity page.' })
  source!: (typeof POST_SOURCES)[number];

  @ZodField(z.iso.datetime())
  fetched_at!: string;

  @ZodField(z.string().nullable().default(null))
  author_urn!: string | null;

  @ZodField([LinkedInPost])
  posts!: LinkedInPost[];

  @ZodField(z.array(z.string()), { description: 'Fields the source could not provide.' })
  unavailable_fields!: string[];
}
