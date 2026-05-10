# Claude Code Entry Point

@AGENTS.md

Claude Code reads `CLAUDE.md` automatically, while other coding agents may read `AGENTS.md` directly. Keep shared project guidance in `AGENTS.md`; keep this file limited to Claude Code compatibility notes.

## Claude Code Skills

Claude-specific slash-command skills remain in `.claude/skills/` and wrap the shared workflow docs in `docs/agent-workflows/`:

- `/bump-version`: follows `docs/agent-workflows/bump-version.md`.
- `/pr`: follows `docs/agent-workflows/pr.md`.
- `/cleanup`: follows `docs/agent-workflows/cleanup.md`.

These skills are Claude Code entrypoints, not general project structure. Keep shared workflow details in `docs/agent-workflows/` and keep `.claude/skills/` as Claude wrappers.
