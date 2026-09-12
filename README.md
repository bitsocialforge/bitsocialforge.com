# bitsocialforge.com

Company website for **Bitsocial Forge Inc.** — the infrastructure company
accelerating peer-to-peer social media on the open
[Bitsocial](https://bitsocial.net) protocol. First product:
[Forge RPC](https://github.com/bitsocialforge), the first public non-custodial
Bitsocial RPC service.

This repository is public so the site, its operating conventions, and its
deployment-facing configuration can be inspected, improved, and reused.

## Stack

Static React + TypeScript site built with Vite, using Yarn 4 and Node 22.12.0
to stay aligned with 5chan and adjacent Bitsocial projects. The Exo and Spline
Sans Mono fonts are self-hosted, with global styling in `styles.css`.

```bash
corepack enable
corepack yarn install
corepack yarn start   # http://localhost:4173
```

Useful checks:

```bash
corepack yarn type-check
corepack yarn lint
corepack yarn build
```

## Deploy

Hosted on Vercel — every push to `master` deploys production at
[bitsocialforge.com](https://bitsocialforge.com). DNS on Cloudflare. See
`docs/agent-playbooks/deployment.md`.

## AI workflow

Agent policy lives in [AGENTS.md](AGENTS.md), with repo-managed skills, hooks,
and playbooks under `.agents/`, native `.claude/`, `.cursor/`, `.codex/`, and
`docs/agent-playbooks/`.

Shared skills and role sources live in `.agents/`; `yarn ai-workflow:sync` generates native compatibility files. Run `yarn ai-workflow:check` and `yarn ai-workflow:test` after AI workflow edits. `yarn agent:verify` runs the explicit integration and asset checks; lifecycle hooks only format edited files. See [verification guidance](docs/agent-playbooks/verification.md).

## License

Bitsocial Forge-authored source code and documentation are available under the
[GNU General Public License v3.0 or later](LICENSE). Bundled skills and fonts
retain their upstream terms; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

The license does not grant rights to the Bitsocial Forge trademarks. See
[TRADEMARKS.md](TRADEMARKS.md).
