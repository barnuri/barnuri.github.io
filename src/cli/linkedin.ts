import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { LinkedInSettings } from '../configs/linkedin-settings.ts';
import { EXIT_CODES } from '../consts/exit-codes.ts';
import {
  ARCHIVE_FILES,
  DEFAULT_EXPORT_WAIT_MINUTES,
  DEFAULT_IMPORT_DIR,
  GITHUB_SECRET_NAME,
  READ_POSTS_SCOPE,
  RECENT_ARCHIVE_HOURS,
} from '../consts/linkedin-api.ts';
import { DATA_DIR, LINKEDIN_PROFILE_FILE_NAME } from '../consts/paths.ts';
import { AuthenticationError } from '../errors/authentication-error.ts';
import { ExportFormatError } from '../errors/export-format-error.ts';
import { LinkedInApiError } from '../errors/linkedin-api-error.ts';
import { MissingPermissionError } from '../errors/missing-permission-error.ts';
import { LinkedInProfile } from '../schemas/linkedin/linkedin-profile.ts';
import type { PostCollection } from '../schemas/linkedin/post-collection.ts';
import { OAuthHelper } from '../services/auth/oauth-helper.ts';
import { LinkedInArchiveImporter } from '../services/linkedin/archive-importer.ts';
import { LinkedInArchiveReader } from '../services/linkedin/archive-reader.ts';
import { LinkedInExportAutomation } from '../services/linkedin/export-automation.ts';
import { isRecentArchive } from '../services/linkedin/export-page.ts';
import { ExportImporter } from '../services/linkedin/export-importer.ts';
import { LinkedInClient } from '../services/linkedin/linkedin-client.ts';
import { PostFetcher } from '../services/linkedin/post-fetcher.ts';
import { ProfileImporter } from '../services/linkedin/profile-importer.ts';
import { PostWriter } from '../services/output/post-writer.ts';

const SECONDS_PER_DAY = 86_400;

const USAGE = `Usage: bun run linkedin <command> [options]

Commands:
  fetch [--output-dir DIR]                         Fetch your posts with the official Posts API.
  import-export SHARES_CSV [--output-dir DIR]      Import posts from the LinkedIn data export.
  import-profile EXPORT_DIR [--output-dir DIR]     Import experience and education (Positions.csv, Education.csv).
  import [PATH] [--output-dir DIR]                 Import posts, experience and education from the LinkedIn export
                                                   zip or folder. PATH defaults to imports/linkedin, DIR to data.
  export [--full] [--wait-minutes N] [--force]     Open LinkedIn "Download your data" in a visible browser, request and
                                                   download the archive into imports/linkedin, then import it. Skips
                                                   the browser when a zip from the last 24 hours is already there.
  auth-url --redirect-uri URL                      Print the OAuth authorization URL.
  exchange-code --code CODE --redirect-uri URL --repo OWNER/NAME
                                                   Exchange the code and store the token as a repo secret.`;

const PERMISSION_HELP = `LinkedIn only lets approved apps read a member's posts. ${READ_POSTS_SCOPE} is restricted and is
available to approved users only, so a self-serve app gets 403 here. w_member_social only allows posting.

Fallback with the official data export:
  1. LinkedIn > Settings > Data privacy > Get a copy of your data > select "Posts" (or the full archive).
  2. Download the archive when LinkedIn emails you, and unzip it.
  3. Run: bun run linkedin import-export path/to/Shares.csv --output-dir data
  4. Commit data/linkedin_posts.json. The daily workflow keeps it while the API stays unavailable.`;

async function writeAndReport(collection: PostCollection, outputDir: string): Promise<number> {
  const { jsonPath, markdownPath } = await new PostWriter(outputDir).write(collection);
  console.log(`Wrote ${jsonPath} and ${markdownPath}.`);
  console.log(PostWriter.summary(collection));
  return EXIT_CODES.ok;
}

async function runFetch(outputDir: string): Promise<number> {
  const settings = LinkedInSettings.fromEnv();
  if (!settings.hasAccessToken) {
    console.error('LINKEDIN_ACCESS_TOKEN is not set. Run auth-url and exchange-code, or export it in this shell session only.');
    return EXIT_CODES.authentication;
  }
  try {
    const fetcher = new PostFetcher(new LinkedInClient(settings), settings.hasClientCredentials);
    return await writeAndReport(await fetcher.fetch(), outputDir);
  } catch (err) {
    if (err instanceof MissingPermissionError) {
      console.error(`${err.message}\n\n${PERMISSION_HELP}`);
      return EXIT_CODES.missingPermission;
    }
    if (err instanceof AuthenticationError) {
      console.error(`${err.message} Create a new token with auth-url and exchange-code.`);
      return EXIT_CODES.authentication;
    }
    if (err instanceof LinkedInApiError) {
      console.error(err.message);
      return EXIT_CODES.apiError;
    }
    throw err;
  }
}

async function runImportExport(sharesCsv: string | undefined, outputDir: string): Promise<number> {
  if (!sharesCsv) {
    console.error(`import-export needs the path to Shares.csv.\n\n${USAGE}`);
    return EXIT_CODES.usage;
  }
  try {
    return await writeAndReport(await new ExportImporter().load(sharesCsv), outputDir);
  } catch (err) {
    if (err instanceof ExportFormatError) {
      console.error(err.message);
      return EXIT_CODES.exportFormat;
    }
    throw err;
  }
}

async function runImportProfile(exportDir: string | undefined, outputDir: string): Promise<number> {
  if (!exportDir) {
    console.error(`import-profile needs the unzipped LinkedIn data archive folder.\n\n${USAGE}`);
    return EXIT_CODES.usage;
  }
  try {
    const profile = await new ProfileImporter().loadDir(exportDir);
    await mkdir(outputDir, { recursive: true });
    const path = join(outputDir, LINKEDIN_PROFILE_FILE_NAME);
    await Bun.write(path, `${JSON.stringify(profile, null, 2)}\n`);
    console.log(`Wrote ${path} with ${profile.positions.length} positions and ${profile.education.length} education entries.`);
    return EXIT_CODES.ok;
  } catch (err) {
    if (err instanceof ExportFormatError) {
      console.error(err.message);
      return EXIT_CODES.exportFormat;
    }
    throw err;
  }
}

async function readExistingProfile(outputDir: string): Promise<LinkedInProfile | null> {
  const file = Bun.file(join(outputDir, LINKEDIN_PROFILE_FILE_NAME));
  if (!(await file.exists())) {
    return null;
  }
  const parsed = LinkedInProfile.safeParse(await file.json());
  return parsed.success ? parsed.data : null;
}

async function runImport(path: string, outputDir: string): Promise<number> {
  try {
    const { source, contents } = await new LinkedInArchiveReader().read(path);
    const found = Object.entries(ARCHIVE_FILES)
      .filter(([key]) => contents[key as keyof typeof contents] !== undefined)
      .map(([, name]) => name);
    console.log(`Read ${found.join(', ') || 'no usable files'} from ${source}.`);

    const result = new LinkedInArchiveImporter().build(contents, await readExistingProfile(outputDir));
    if (!result.posts && !result.profile) {
      console.error(`${source} has none of ${Object.values(ARCHIVE_FILES).join(', ')}. Existing data is kept.`);
      return EXIT_CODES.exportFormat;
    }
    if (result.posts) {
      const { jsonPath } = await new PostWriter(outputDir).write(result.posts);
      const visibility = Object.entries(result.postVisibility).map(([name, count]) => `${name}: ${count}`).join(', ');
      console.log(`Wrote ${jsonPath} with ${result.posts.posts.length} posts. Visibility: ${visibility || 'none'}.`);
    } else {
      console.log(`${ARCHIVE_FILES.shares} not found. Existing LinkedIn posts are kept.`);
    }
    if (result.profile) {
      await mkdir(outputDir, { recursive: true });
      const profilePath = join(outputDir, LINKEDIN_PROFILE_FILE_NAME);
      await Bun.write(profilePath, `${JSON.stringify(result.profile, null, 2)}\n`);
      console.log(
        `Wrote ${profilePath} with ${result.profile.positions.length} positions and ${result.profile.education.length} education entries.`,
      );
    }
    return EXIT_CODES.ok;
  } catch (err) {
    if (err instanceof ExportFormatError) {
      console.error(err.message);
      return EXIT_CODES.exportFormat;
    }
    throw err;
  }
}

async function runExport(options: { fullArchive: boolean; waitMinutes: number; force: boolean }): Promise<number> {
  const recent = await LinkedInArchiveReader.newestZip(DEFAULT_IMPORT_DIR);
  if (!options.force && recent && isRecentArchive(recent.modified, new Date(), RECENT_ARCHIVE_HOURS)) {
    console.log(`Using ${recent.path}, downloaded ${recent.modified.toISOString()}. Pass --force to download a new archive.`);
    return runImport(DEFAULT_IMPORT_DIR, DATA_DIR);
  }
  const saved = await new LinkedInExportAutomation({
    importDir: DEFAULT_IMPORT_DIR,
    waitMinutes: options.waitMinutes,
    fullArchive: options.fullArchive,
  }).run();
  if (!saved) {
    return EXIT_CODES.ok;
  }
  return runImport(DEFAULT_IMPORT_DIR, DATA_DIR);
}

function runAuthUrl(redirectUri: string): number {
  const state = crypto.randomUUID();
  const url = new OAuthHelper(LinkedInSettings.fromEnv()).authorizationUrl(redirectUri, state);
  console.log('Open this URL, approve access, then copy the code parameter from the redirect URL:');
  console.log(url);
  console.log(`Check that the redirect URL has state=${state} before you use its code.`);
  return EXIT_CODES.ok;
}

async function runExchangeCode(code: string, redirectUri: string, repo: string): Promise<number> {
  const token = await new OAuthHelper(LinkedInSettings.fromEnv()).exchangeCode(code, redirectUri);
  try {
    await OAuthHelper.storeToken(token, repo);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error(`Could not store the token with gh secret set: ${reason}. The token was not saved anywhere.`);
    return EXIT_CODES.authentication;
  }
  console.log(`Stored the token as the ${GITHUB_SECRET_NAME} secret in ${repo}.`);
  console.log(`It expires in ${Math.floor(token.expires_in / SECONDS_PER_DAY)} days. Granted scopes: ${token.scope ?? 'not reported'}.`);
  return EXIT_CODES.ok;
}

async function main(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      'output-dir': { type: 'string' },
      'redirect-uri': { type: 'string' },
      code: { type: 'string' },
      repo: { type: 'string' },
      full: { type: 'boolean', default: false },
      force: { type: 'boolean', default: false },
      'wait-minutes': { type: 'string' },
    },
  });
  const [command, argument] = positionals;
  const outputDir = values['output-dir'] ?? '.';
  const importOutputDir = values['output-dir'] ?? DATA_DIR;
  const redirectUri = values['redirect-uri'];

  try {
    if (command === 'fetch') {
      return await runFetch(outputDir);
    }
    if (command === 'import-export') {
      return await runImportExport(argument, outputDir);
    }
    if (command === 'export') {
      const waitMinutes = Number(values['wait-minutes'] ?? DEFAULT_EXPORT_WAIT_MINUTES);
      if (!Number.isFinite(waitMinutes) || waitMinutes < 0) {
        console.error('--wait-minutes must be a number of minutes, 0 or more.');
        return EXIT_CODES.usage;
      }
      return await runExport({ fullArchive: values.full ?? false, waitMinutes, force: values.force ?? false });
    }
    if (command === 'import') {
      return await runImport(argument ?? DEFAULT_IMPORT_DIR, importOutputDir);
    }
    if (command === 'import-profile') {
      return await runImportProfile(argument, outputDir);
    }
    if (command === 'auth-url' && redirectUri) {
      return runAuthUrl(redirectUri);
    }
    if (command === 'exchange-code' && redirectUri && values.code && values.repo) {
      return await runExchangeCode(values.code, redirectUri, values.repo);
    }
  } catch (err) {
    if (err instanceof AuthenticationError) {
      console.error(err.message);
      return EXIT_CODES.authentication;
    }
    throw err;
  }
  console.error(USAGE);
  return EXIT_CODES.usage;
}

process.exit(await main(Bun.argv.slice(2)));
