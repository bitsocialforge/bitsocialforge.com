---
name: modern-web-guidance
description: Look up browser support and implementation guidance when choosing a native control, focus behavior, browser API, or browser-sensitive layout.
---

<!-- Generated from .agents/skills/modern-web-guidance/SKILL.md; run yarn ai-workflow:sync. -->

From the project root, use the CLI pinned in the lockfile. Search for the browser behavior, then retrieve the matching guide by its returned ID.

```sh
DISABLE_TELEMETRY=1 yarn modern-web-guidance search "respect reduced motion"
DISABLE_TELEMETRY=1 yarn modern-web-guidance retrieve motion
```

Apply the relevant guidance to the site. Preserve its visual identity and verify the affected browser behavior using the [browser verification playbook](../../../docs/agent-playbooks/verification.md).
