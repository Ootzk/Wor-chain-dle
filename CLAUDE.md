# Claude Code Entry Point

@AGENTS.md

Claude Code reads `CLAUDE.md` automatically, while other coding agents may read `AGENTS.md` directly. Keep shared project guidance in `AGENTS.md`; keep this file limited to Claude Code compatibility notes.

## Claude Code Skills

Claude-specific slash-command skills remain in `.claude/skills/`:

- `/bump-version`: update `package.json`, `package-lock.json`, and `PATCH_NOTES_VERSION`.
- `/pr`: create a PR with required labels, assignee, milestone, and body format.
- `/cleanup`: clean up local feature branches after merge.

These skills are Claude Code entrypoints, not general project structure. If their contents become useful across agents, move the shared workflow notes into `AGENTS.md` or `docs/agent-workflows/` and keep `.claude/skills/` as Claude wrappers.
