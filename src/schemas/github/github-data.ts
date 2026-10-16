import { ZodDto, ZodField, ZodObject } from '@barnuri/zod-decorators';
import { Activity } from './activity.ts';
import { Contributions } from './contributions.ts';
import { Repo } from './repo.ts';

@ZodObject({ description: 'Everything the page shows from GitHub, stored in data/github.json.' })
export class GitHubData extends ZodDto {
  @ZodField([Repo])
  featured!: Repo[];

  @ZodField([Repo])
  recent!: Repo[];

  @ZodField(Contributions)
  contributions!: Contributions;

  @ZodField(Activity.schema.default({ ...Activity.EMPTY }))
  activity!: Activity;
}
