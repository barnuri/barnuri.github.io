# LinkedIn export drop folder

Put the zip LinkedIn emails you in this folder. Git ignores everything here except this file, so the export never reaches the public repo. Only the cleaned `data/linkedin_posts.json` and `data/linkedin_profile.json` get committed.

## 1. Request the export

You need a computer. LinkedIn does not offer the export on mobile.

1. Open [Download your data](https://www.linkedin.com/mypreferences/d/download-my-data). If the link does not open the page, go to [Settings > Data privacy](https://www.linkedin.com/psettings/data-privacy/) and click **Download your data**.
2. Select **Want something in particular?** and check:
   - **Profile**
   - **Positions**
   - **Education**
   - **Shares**, which holds your posts
3. Click **Request archive**.

You can also select the larger archive instead. It arrives within 24 hours.

## 2. Download it

LinkedIn sends one email per archive:

| Archive | Arrives | Contains |
|---|---|---|
| Fast | Within about 10 minutes | Profile, positions, education |
| Full | Within 48 hours | Shares (posts) and the rest |

Each download link works for 72 hours. Download the zip from each email.

## 3. Drop it here

Move each zip into this folder. Don't unzip or rename it. When several zips are here, the import takes each file from the newest zip that has it.

## 4. Import it

Ask Claude to "import my LinkedIn export", or run:

```bash
bun run linkedin import
```

The import reads only `Shares.csv`, `Positions.csv` and `Education.csv` from the zip, in memory, and writes:

- `data/linkedin_posts.json` and `data/linkedin_posts.md`
- `data/linkedin_profile.json`

A file the export doesn't include is left unchanged. For example, the fast export without Shares keeps your existing posts.

Check the visibility counts the import prints, then commit the `data/` files and push. The push deploys the page.

## Why the zip is never committed

The archive also holds your messages, connections and contact details, which include other people's personal data. The pages workflow fails if a file from this folder other than this README is committed.

More help: [LinkedIn: Download your account data](https://www.linkedin.com/help/linkedin/answer/a1339364).
