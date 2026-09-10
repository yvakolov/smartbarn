# Smart Barn — Agent Entry Point

This file is the repository entry point for Codex and other coding agents that support `AGENTS.md`.

Before planning or changing the project, read:

- [`ai/PROJECT_CONTEXT.md`](ai/PROJECT_CONTEXT.md) — shared, vendor-neutral project context for all AI orchestrators and agents.

## Rules

1. Do not duplicate the project context in this file.
2. Load additional context lazily. Follow the routing in `ai/PROJECT_CONTEXT.md` only when the current task requires it.
3. Treat repository specifications, ADRs and architecture models referenced by the project context as authoritative for their scope.
4. Never store secret values, tokens, passwords, API keys or credentials in repository files, Issues, ADRs, documentation or agent context.
5. Until the repository says otherwise, changes for the current prototype are committed directly to `main`; do not create pull requests.
