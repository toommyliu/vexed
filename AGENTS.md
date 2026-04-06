# AGENTS.md

## Project Description

vexed is a third-party toolkit for enhancing gameplay experiences in AdventureQuest Worlds (AQW).

Proposing sweeping changes that improve long-term maintainability is encouraged.

## Core Priorities

1. Performance first.
2. Reliability first.
3. Keep behavior predictable under load and during failures (unexpected failures, timeouts, disconnects, etc.).

If a tradeoff is required, choose correctness and robustness over short-term convenience.

## Maintainability

Long term maintainability is a core priority. If you add new functionality, first check if there is shared logic that can be extracted to a separate module. Duplicate logic across multiple files is a code smell and should be avoided. Don't be afraid to change existing code. Don't take shortcuts by just adding local logic to solve a problem.

## Package Roles

- `app/src/main` : The main entrypoint for the project. Contains the electron main process.
- `app/src/renderer`: The main entrypoint for the renderer process. Contains the Svelte app(s) and related client side behaviors.
- `app/src/shared`: Shared code between main and renderer processes. This includes shared types, utilities, and any logic that needs to be used in both contexts.
- `packages/`: Shared packages consumed by the app.
