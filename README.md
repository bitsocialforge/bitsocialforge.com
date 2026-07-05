# bitsocialforge.com

Company website for **Bitsocial Forge Inc.** — the infrastructure company
accelerating peer-to-peer social media on the open
[Bitsocial](https://bitsocial.net) protocol. First product:
[Forge RPC](https://github.com/bitsocialforge), the first public non-custodial
Bitsocial RPC service.

## Stack

Dependency-free static site: plain HTML + CSS, self-hosted fonts
(Martian Mono, Spline Sans Mono), no build step.

```bash
/usr/bin/python3 -m http.server 4173 --directory .   # http://localhost:4173
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
