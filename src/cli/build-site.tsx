import { cp, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AboutPage } from '../components/AboutPage.tsx';
import { ContributionsPage } from '../components/ContributionsPage.tsx';
import { HomePage } from '../components/HomePage.tsx';
import { NotFoundPage } from '../components/NotFoundPage.tsx';
import { ProjectsPage } from '../components/ProjectsPage.tsx';
import { GITHUB_DATA_PATH, LINKEDIN_DATA_PATH, LINKEDIN_PROFILE_PATH, OUTPUT_DIR, STATIC_ASSETS, STYLESHEET_PATH } from '../consts/paths.ts';
import { PAGES } from '../consts/site.ts';
import { GitHubData } from '../schemas/github/github-data.ts';
import { LinkedInProfile } from '../schemas/linkedin/linkedin-profile.ts';
import { PostCollection } from '../schemas/linkedin/post-collection.ts';
import { selectLinkedInPosts } from '../services/site/site-data.ts';

const toHtml = (page: ReactElement): string => `<!doctype html>\n${renderToStaticMarkup(page)}\n`;

async function readOptionalJson(path: string): Promise<unknown> {
  const file = Bun.file(path);
  return (await file.exists()) ? file.json() : null;
}

async function writePage(file: string, page: ReactElement): Promise<void> {
  const path = join(OUTPUT_DIR, file);
  await mkdir(dirname(path), { recursive: true });
  await Bun.write(path, toHtml(page));
}

const github = GitHubData.parse(await Bun.file(GITHUB_DATA_PATH).json());
const postsJson = await readOptionalJson(LINKEDIN_DATA_PATH);
const profileJson = await readOptionalJson(LINKEDIN_PROFILE_PATH);
const posts = selectLinkedInPosts(postsJson === null ? null : PostCollection.parse(postsJson));
const profile = profileJson === null ? null : LinkedInProfile.parse(profileJson);
const stylesheet = await Bun.file(STYLESHEET_PATH).text();
const builtAt = new Date().toISOString();
const shared = { builtAt, stylesheet };

await mkdir(OUTPUT_DIR, { recursive: true });
await writePage(PAGES.home.file, <HomePage github={github} linkedInPosts={posts} {...shared} />);
await writePage(PAGES.projects.file, <ProjectsPage github={github} {...shared} />);
await writePage(PAGES.contributions.file, <ContributionsPage github={github} {...shared} />);
await writePage(PAGES.about.file, <AboutPage profile={profile} posts={posts} {...shared} />);
await writePage('404.html', <NotFoundPage {...shared} />);
await Promise.all(STATIC_ASSETS.map((path) => cp(path, join(OUTPUT_DIR, path), { recursive: true })));
console.log(`Built ${Object.keys(PAGES).length} pages and 404.html in ${OUTPUT_DIR}/ with ${posts.length} LinkedIn posts and ${profile?.positions.length ?? 0} positions.`);
