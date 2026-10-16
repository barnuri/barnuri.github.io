import { mkdir } from 'node:fs/promises';
import { ACTIVITY_WINDOW_DAYS } from '../consts/github.ts';
import { DATA_DIR, GITHUB_DATA_PATH } from '../consts/paths.ts';
import type { Activity } from '../schemas/github/activity.ts';
import { type GitHubData, githubDataSchema } from '../schemas/github/github-data.ts';
import { mergeActivity, toActivityItems } from '../services/github/activity-data.ts';
import { GitHubClient } from '../services/github/github-client.ts';
import { selectRepos, toContributions } from '../services/github/profile-data.ts';

const MILLISECONDS_PER_DAY = 86_400_000;

async function readSavedActivity(): Promise<Activity | null> {
  const file = Bun.file(GITHUB_DATA_PATH);
  if (!(await file.exists())) {
    return null;
  }
  const saved = githubDataSchema.safeParse(await file.json());
  if (!saved.success) {
    console.warn(`${GITHUB_DATA_PATH} does not match the current schema. Starting the activity history fresh.`);
    return null;
  }
  return saved.data.activity;
}

const login = process.env.PROFILE_LOGIN || 'barnuri';
const token = process.env.PROFILE_TOKEN || process.env.GITHUB_TOKEN;
if (!token) {
  console.error('Set PROFILE_TOKEN or GITHUB_TOKEN to read GitHub data.');
  process.exit(1);
}

const client = new GitHubClient(token);
const activityFrom = new Date(Date.now() - ACTIVITY_WINDOW_DAYS * MILLISECONDS_PER_DAY);
const [profile, activityCollection, savedActivity] = await Promise.all([
  client.fetchProfile(login),
  client.fetchActivity(login, activityFrom),
  readSavedActivity(),
]);

const freshActivity: Activity = {
  items: toActivityItems(activityCollection),
  privateContributions: activityCollection.restrictedContributionsCount,
};
const data: GitHubData = {
  ...selectRepos(login, profile.starred.nodes, profile.recent.nodes),
  contributions: toContributions(profile.contributionsCollection.contributionCalendar),
  activity: mergeActivity(savedActivity, freshActivity),
};

await mkdir(DATA_DIR, { recursive: true });
await Bun.write(GITHUB_DATA_PATH, `${JSON.stringify(data, null, 2)}\n`);
console.log(
  `Wrote ${GITHUB_DATA_PATH} with ${data.featured.length} featured repos, ${data.recent.length} recent repos ` +
    `and ${data.activity.items.length} activities.`,
);
