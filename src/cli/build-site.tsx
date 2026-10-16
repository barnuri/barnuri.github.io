import { cp, mkdir } from 'node:fs/promises';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { HomePage } from '../components/HomePage.tsx';
import { NotFoundPage } from '../components/NotFoundPage.tsx';
import { GITHUB_DATA_PATH, LINKEDIN_DATA_PATH, OUTPUT_DIR, STATIC_ASSETS, STYLESHEET_PATH } from '../consts/paths.ts';
import { githubDataSchema } from '../schemas/github/github-data.ts';
import { type PostCollection, postCollectionSchema } from '../schemas/linkedin/post-collection.ts';
import { selectLinkedInPosts } from '../services/site/site-data.ts';

const toHtml = (page: ReactElement): string => `<!doctype html>\n${renderToStaticMarkup(page)}\n`;

async function readLinkedInPosts(): Promise<PostCollection | null> {
  const file = Bun.file(LINKEDIN_DATA_PATH);
  if (!(await file.exists())) {
    return null;
  }
  return postCollectionSchema.parse(await file.json());
}

const github = githubDataSchema.parse(await Bun.file(GITHUB_DATA_PATH).json());
const linkedInPosts = selectLinkedInPosts(await readLinkedInPosts());
const stylesheet = await Bun.file(STYLESHEET_PATH).text();

await mkdir(OUTPUT_DIR, { recursive: true });
await Bun.write(
  `${OUTPUT_DIR}/index.html`,
  toHtml(<HomePage github={github} linkedInPosts={linkedInPosts} builtAt={new Date().toISOString()} stylesheet={stylesheet} />),
);
await Bun.write(`${OUTPUT_DIR}/404.html`, toHtml(<NotFoundPage stylesheet={stylesheet} />));
await Promise.all(STATIC_ASSETS.map((path) => cp(path, `${OUTPUT_DIR}/${path}`, { recursive: true })));
console.log(`Built ${OUTPUT_DIR}/ with ${linkedInPosts.length} LinkedIn posts.`);
