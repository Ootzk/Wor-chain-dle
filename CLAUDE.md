# Claude Code Entry Point

@AGENTS.md

Claude Code reads `CLAUDE.md` automatically, while other coding agents may read `AGENTS.md` directly. Keep shared project guidance in `AGENTS.md`; keep this file limited to Claude Code compatibility notes.

## Claude Code Skills

Claude-specific slash-command skills remain in `.claude/skills/` and wrap the repository skills in `.agents/skills/`:

- `/bump-version`: follows `.agents/skills/bump-version/SKILL.md`.
- `/pr`: follows `.agents/skills/pr/SKILL.md`.
- `/cleanup`: follows `.agents/skills/cleanup/SKILL.md`.

These skills are Claude Code entrypoints, not general project structure. Keep shared workflow details in `.agents/skills/` and keep `.claude/skills/` as Claude wrappers.
