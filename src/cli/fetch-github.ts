import { mkdir } from 'node:fs/promises';
import { DATA_DIR, GITHUB_DATA_PATH } from '../consts/paths.ts';
import type { GitHubData } from '../schemas/github/github-data.ts';
import { GitHubClient } from '../services/github/github-client.ts';
import { selectRepos, toContributions } from '../services/github/profile-data.ts';

const login = process.env.PROFILE_LOGIN || 'barnuri';
const token = process.env.PROFILE_TOKEN || process.env.GITHUB_TOKEN;
if (!token) {
  console.error('Set PROFILE_TOKEN or GITHUB_TOKEN to read GitHub data.');
  process.exit(1);
}

const profile = await new GitHubClient(token).fetchProfile(login);
const data: GitHubData = {
  ...selectRepos(login, profile.starred.nodes, profile.recent.nodes),
  contributions: toContributions(profile.contributionsCollection.contributionCalendar),
};

await mkdir(DATA_DIR, { recursive: true });
await Bun.write(GITHUB_DATA_PATH, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Wrote ${GITHUB_DATA_PATH} with ${data.featured.length} featured and ${data.recent.length} recent repos.`);
