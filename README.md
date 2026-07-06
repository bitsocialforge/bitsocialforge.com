# bitsocialforge.com

Company website for **Bitsocial Forge Inc.** — the infrastructure company
accelerating peer-to-peer social media on the open
[Bitsocial](https://bitsocial.net) protocol. First product:
[Forge RPC](https://github.com/bitsocialforge), the first public non-custodial
Bitsocial RPC service.

## Stack

Static React + TypeScript site built with Vite, using Yarn 4 and Node 22.12.0
to stay aligned with 5chan and adjacent Bitsocial projects. Fonts are
self-hosted (Martian Mono, Spline Sans Mono), with global styling in
`styles.css`.

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
and playbooks under `.claude/`, `.cursor/`, `.codex/`, and
`docs/agent-playbooks/` (mirrored per toolchain).

© Bitsocial Forge Inc. All rights reserved.
