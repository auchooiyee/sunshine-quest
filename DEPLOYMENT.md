# Cloudflare Pages deployment

Source repository: https://github.com/auchooiyee/sunshine-quest

Student URL: https://sunshine-quest.pages.dev/?view=regions

Pages project: `sunshine-quest`. Git integration watches `auchooiyee/sunshine-quest` on `main` and publishes production updates automatically.

Use a Git-integrated Cloudflare Pages project with these settings:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Framework preset | None |
| Root directory | Repository root (leave blank) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node.js version | 22 |

`npm run build` copies only the game's runtime files into `dist`. Tests, local reports, development scripts, documentation and credentials are excluded from the public site. Keep `dist` out of Git; Cloudflare builds it from the source on each deployment.

Push a commit to `main` to publish an update. Use another branch for a preview before publishing a change to the student URL. Never commit API tokens or student exports. No Cloudflare token is required inside the game or its Git repository.

The local `npm start` command is for development only. Cloudflare serves `dist/index.html`, its modules, question data and images directly. Student saves remain in their browser, and CSV reports are downloaded locally; this deployment does not add accounts, D1 or online results collection.

For a local build check, run `npm run build` followed by `npm test`. After deployment, check the region map, EN/BM switching, a math station, a teacher mission link and save recovery on the live URL. Browser regression scripts accept `QUEST_URL` to test a deployed copy.

Original project attribution is preserved in `README.md` and `UPSTREAM_README.md`.
