# Deployment (Vercel + Cloudflare)

Use this playbook for anything touching production hosting or DNS. Update it if the deploy topology changes.

## Production Hosting

- Production is the **Vercel project `bitsocialforge-com`** (team `toms-projects-2188af94`), deployed from the GitHub repo `bitsocialforge/bitsocialforge.com` (private, default branch `master`).
- **Every push to `master` auto-deploys production** via the GitHub Actions workflow `.github/workflows/deploy.yml`, which runs `vercel deploy --prod` with the `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` repo secrets. The Vercel GitHub App is NOT installed on the `bitsocialforge` org; if it ever is, the native integration can replace this workflow (delete the workflow and secrets in the same change, and update this playbook).
- Vercel builds the Vite app with `corepack yarn build` and serves the generated `dist` directory. `www` redirects to the apex via `vercel.json`.
- The GitHub Actions deploy workflow installs with `corepack yarn install --immutable`, then runs `type-check`, `lint`, and `build` before invoking `vercel deploy --prod`.
- Because pushes go straight to production, keep `master` releasable and verify locally before pushing (see the Verification Rules in `AGENTS.md`).
- The `vercel` CLI is authenticated as `tomcasaburi`.

## Domains and DNS

Domains: `bitsocialforge.com` and `www.bitsocialforge.com`, with DNS managed on **Cloudflare**.

| Type  | Name  | Value                  | Notes                                   |
| ----- | ----- | ---------------------- | --------------------------------------- |
| A     | `@`   | `76.76.21.21`          | Vercel apex IP                          |
| CNAME | `www` | `cname.vercel-dns.com` | Vercel-managed cert + redirect handling |

- **DNS-only (grey cloud) is recommended** for both records: Vercel terminates TLS itself, and proxying through Cloudflare (orange cloud) can interfere with Vercel's certificate issuance and redirects.

## Credentials

- The Cloudflare **DNS-scope API token** lives at `/Users/Tommaso/Vault/cloudflare api-dns scope.txt` on the developer machine. **NEVER commit it** (or any credential) to the repo.
- Vercel credentials also live outside the repo (CLI auth as `tomcasaburi`).

## Operational Notes

- To inspect or change DNS from a shell, read the token from the Vault path above and call the Cloudflare API with it; do not paste the token into tracked files, logs, or commit messages.
- To check deploy state: `vercel ls` / `vercel inspect` (CLI), or the Vercel dashboard for the project connected to `bitsocialforge/bitsocialforge.com`.
- If the deploy topology changes (different repo slug, branch, DNS host, or hosting provider), update this playbook in the same change.
