# Skills and tools

Edit `.agents/skills/` and `.agents/roles/`, then run:

```bash
corepack yarn ai-workflow:sync
corepack yarn ai-workflow:check
corepack yarn ai-workflow:test
```

Commit the shared sources and resulting native files together. The check detects missing/drifted outputs and obsolete compatibility files; synchronization never silently deletes files. Do not edit generated copies directly.

## Native discovery and generation

`.agents/roles/` is a repository-specific source format consumed by `scripts/ai-workflow-files.mjs`; no app is expected to discover it. It is deliberately separate from native configuration:

| App | Skills | Custom agents | Project instructions |
|---|---|---|---|
| Codex | `.agents/skills/<name>/SKILL.md` | Generated `.codex/agents/*.toml` | Root and scoped `AGENTS.md` |
| Cursor | `.agents/skills/<name>/SKILL.md` | Generated `.cursor/agents/*.md` | `AGENTS.md`; `.cursor/rules` remains available for conditional rules |
| Claude Code | Generated `.claude/skills/<name>/SKILL.md` | Generated `.claude/agents/*.md` | `CLAUDE.md` imports `@AGENTS.md` |

Official references: [Codex skills](https://learn.chatgpt.com/docs/build-skills), [Codex subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents), [Cursor skills](https://cursor.com/docs/skills), [Cursor agents](https://cursor.com/docs/subagents), [Cursor rules](https://cursor.com/docs/rules), [Claude skills](https://code.claude.com/docs/en/skills), [Claude agents](https://code.claude.com/docs/en/sub-agents), and [Claude memory imports](https://code.claude.com/docs/en/memory).

The source role fields are `name`, `description`, and optional `sandbox-mode`. The generator renders the name, description, and instructions in each native schema. A read-only role gets Codex `sandbox_mode`, Cursor `readonly`, and Claude’s Bash/Read/Grep/Glob tool list. Claude’s tool list is not an OS sandbox: the instructions still prohibit mutations.

Model and reasoning fields are omitted from skills and agent definitions. The app, user settings, and supported invocation overrides choose or inherit them. This avoids generation-specific pins without promising that inheritance dynamically selects the best model. The generator rejects source role model fields.

Keep hook configuration, permissions, plugin settings, and launch metadata native; they are not interchangeable. See [hooks-setup.md](hooks-setup.md). Workflow tests establish parsed schemas, deterministic generation, and hook behavior using disposable fixtures; they do not prove end-to-end delegation in each installed app. Trust settings and app discovery/reload behavior still apply. Cursor can also discover Claude compatibility skill directories; its published precedence for duplicate names is unspecified.

## Maintaining instructions

Keep skill descriptions short and specific. Put only essential decisions in `SKILL.md`; load references for the modes that need them. Preserve invocation policy, supported metadata, licensed resources, and task-specific constraints when shortening a skill. Do not turn a suggested process into a new approval gate, fixed agent chain, automatic commit, or blanket full-suite requirement.

Use `.agents/skills` for deliberate repository skill additions. Ordinary coding tasks should use installed capabilities; skill discovery and installation require a relevant request. Use built-in workers for ordinary implementation, with explicit file ownership. Custom roles cover independent review and genuinely specialized verification.

This follows the principles in OpenAI’s [rethinking skills and prompts](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra) article, reviewed September 12, 2026. Validate model behavior with narrow realistic requests when useful, distinct from the deterministic workflow tests.

## Repository-specific tools

`impeccable` and `frontend-design` retain their licensed design references and scripts. The company’s pinned identity and factual copy rules in `AGENTS.md` take priority over generic aesthetics. Use `playwright-cli` for scoped browser verification; the `browser-check` role reports evidence without editing source. The `reviewer` role performs independent diff review.

Use `gh` for GitHub operations and the installed Vercel tools when deployment is in scope. No automatic plugin installation or deployment is part of a skill migration.
