# Cloudflare Pages deployment

Source repository: https://github.com/auchooiyee/sunshine-quest

Student URL: https://sunshine-quest.pages.dev/?view=regions

Pages project: `sunshine-quest`. Git integration is configured for `auchooiyee/sunshine-quest` on `main`, with automatic production deployments enabled.

## Deployment status

On 17 October 2026 (Malaysia), v0.10 from game commit `ce6a29d` was published to production with Wrangler after `npm test` passed all 92 tests and `npm run build` produced 71 public files. Deployment: https://ce1e1062.sunshine-quest.pages.dev. The production URL was checked for region-specific monsters, the sword-combo/dash controls, and the four-level sword/axe workshop with material costs; no browser errors or warnings were reported during that check.

The Pages dashboard reports that this project is disconnected from the Git account. Automatic deployments are enabled in its settings, but the v0.10 push did not trigger a build. In https://github.com/settings/installations, check the **Cloudflare Workers & Pages** installation and repository access before relying on automatic updates. This release used a direct upload to the existing Pages project; it did not change the Git integration. Until that connection is repaired and verified, build locally and publish with `wrangler pages deploy dist --project-name sunshine-quest --branch main --commit-hash <full-game-commit>`.

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

After verifying GitHub installation access and automatic deployment, push a commit to `main` to publish an update. Use another branch for a preview before publishing a change to the student URL. Never commit API tokens or student exports. No Cloudflare token is required inside the game or its Git repository.

The local `npm start` command is for development only. Cloudflare serves `dist/index.html`, its modules, question data and images directly. Student saves remain in their browser, and CSV reports are downloaded locally; this deployment does not add accounts, D1 or online results collection.

For a local build check, run `npm run build` followed by `npm test`. After deployment, check the region map, EN/BM switching, a math station, a teacher mission link and save recovery on the live URL. Browser regression scripts accept `QUEST_URL` to test a deployed copy.

Original project attribution is preserved in `README.md` and `UPSTREAM_README.md`.
