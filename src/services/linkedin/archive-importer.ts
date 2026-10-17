import { ARCHIVE_FILES } from '../../consts/linkedin-api.ts';
import type { LinkedInProfile } from '../../schemas/linkedin/linkedin-profile.ts';
import type { PostCollection } from '../../schemas/linkedin/post-collection.ts';
import type { ArchiveContents } from './archive-reader.ts';
import { ExportImporter } from './export-importer.ts';
import { ProfileImporter } from './profile-importer.ts';

export interface ArchiveImportResult {
  readonly posts: PostCollection | null;
  readonly profile: LinkedInProfile | null;
  readonly postVisibility: Readonly<Record<string, number>>;
}

export class LinkedInArchiveImporter {
  static readonly UNKNOWN_VISIBILITY = 'not set';

  constructor(
    private readonly exportImporter: ExportImporter = new ExportImporter(),
    private readonly profileImporter: ProfileImporter = new ProfileImporter(),
  ) {}

  build(contents: ArchiveContents, existingProfile: LinkedInProfile | null): ArchiveImportResult {
    const posts = contents.shares ? this.exportImporter.parse(contents.shares, ARCHIVE_FILES.shares) : null;
    return {
      posts,
      profile: this.buildProfile(contents, existingProfile),
      postVisibility: LinkedInArchiveImporter.countVisibility(posts),
    };
  }

  private buildProfile(contents: ArchiveContents, existingProfile: LinkedInProfile | null): LinkedInProfile | null {
    if (!contents.positions && !contents.education && !contents.profile) {
      return null;
    }
    const parsed = this.profileImporter.parse(contents.positions ?? '', contents.education ?? '');
    const about = contents.profile ? ProfileImporter.parseHeadlineAndSummary(contents.profile) : null;
    return {
      ...parsed,
      headline: about ? about.headline : (existingProfile?.headline ?? null),
      summary: about ? about.summary : (existingProfile?.summary ?? null),
      positions: contents.positions ? parsed.positions : (existingProfile?.positions ?? []),
      education: contents.education ? parsed.education : (existingProfile?.education ?? []),
    };
  }

  private static countVisibility(posts: PostCollection | null): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const post of posts?.posts ?? []) {
      const visibility = post.visibility ?? LinkedInArchiveImporter.UNKNOWN_VISIBILITY;
      counts[visibility] = (counts[visibility] ?? 0) + 1;
    }
    return counts;
  }
}
