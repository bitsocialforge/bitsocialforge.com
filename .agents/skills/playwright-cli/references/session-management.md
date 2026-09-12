# Session ownership and coverage

Use the task's URL and a unique session name. A reachable canonical `http://localhost:4173` server may belong to another checkout; confirm compatibility before using it. A delegated browser checker does not manage dev servers. The task owner records and later stops only the server it started.

Coordinate browser ownership across the task. Use `playwright-cli list` to inspect sessions, never terminate another task’s browser, and run only one engine at a time.

An owned-shell cleanup pattern:

```bash
set -e
browser_session=check-task
playwright-cli -s="$browser_session" open "http://localhost:4173/" --browser=chrome
trap 'playwright-cli -s="$browser_session" close' EXIT
playwright-cli -s="$browser_session" snapshot
# Complete the affected desktop flow before changing viewport.
playwright-cli -s="$browser_session" resize 375 812
playwright-cli -s="$browser_session" snapshot
```

Replace the URL/name and select coverage using `SKILL.md`. Finish desktop/mobile in the current engine, then close it before the next engine opens. Use a fresh shell for this trap or preserve an existing caller's cleanup handler.

`resize` checks viewport layout. If touch/device behavior matters, use the installed CLI's `open --mobile` or `--device` option when opening the session and record the emulation. Desktop resizing alone is not a touch test.

`--persistent` keeps an isolated profile on disk; `--profile` selects one. Neither grants access to a contributor's active personal browser. Reuse such state only when authorized and supported by the installed harness. Preserve profiles or data that predate this task.

Do not launch parallel A/B sessions. Compare variants sequentially with equivalent starting state. Never close default/unknown sessions, use global cleanup commands, or terminate extra Vite processes based on their count.
