# barnuri.github.io

Personal page built from GitHub and LinkedIn data with Bun, TypeScript and React 19. React renders static HTML at build time. The only script is a small "Show more" button for the activity feed, and the page works without it.

## How it updates

1. `.github/workflows/data.yml` runs daily at 03:17 UTC and on manual dispatch. It fetches GitHub data and LinkedIn posts into `data/`. It commits `data/` only when something changed, then starts the deploy.
2. `.github/workflows/pages.yml` builds `dist/` from the committed data and deploys it to GitHub Pages. It runs on push to `master` and on manual dispatch.

A missing or rejected LinkedIn token never blocks the GitHub update. The data job skips LinkedIn and keeps the last `data/linkedin_posts.json`.

## Repository secrets

| Secret | Required | Use |
|---|---|---|
| `PROFILE_TOKEN` | No | GitHub token for your account. Without it the job uses `GITHUB_TOKEN`, and the contribution count may include public contributions only. |
| `LINKEDIN_ACCESS_TOKEN` | No | LinkedIn member token with `r_member_social`. |
| `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | No | Lets the CLI check the token scopes before it reads posts. |

## Commands

Requires Bun 1.4 or later.

```bash
bun install
PROFILE_TOKEN=$(gh auth token) bun run fetch:github   # writes data/github.json
bun run build                                         # writes dist/ from data/
bun test
bun run typecheck
```

## LinkedIn CLI

Set credentials in the current shell session only. Never put them in a file.

```bash
bun run linkedin fetch --output-dir data
bun run linkedin import-export ~/Downloads/Shares.csv --output-dir data
```

Both commands write `linkedin_posts.json` and `linkedin_posts.md` and print a summary. `fetch` exit codes: 2 for a missing or invalid token, 3 when LinkedIn refuses `r_member_social`, 4 for other API errors.

### Get a LinkedIn token

LinkedIn grants `r_member_social` to approved developers only. A self-serve app gets 403 on the Posts API. In that case use `import-export` with `Shares.csv` from LinkedIn > Settings > Data privacy > Get a copy of your data.

With an approved app:

```bash
bun run linkedin auth-url --redirect-uri <redirect URL registered in the app>
bun run linkedin exchange-code --code <code> --redirect-uri <same URL> --repo barnuri/barnuri.github.io
```

`exchange-code` sends the token straight to `gh secret set LINKEDIN_ACCESS_TOKEN`. It never prints the token or writes it to disk. Member tokens expire, so repeat these two commands when the data job reports exit code 2.
