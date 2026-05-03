List of capabilities added/removed/modified in the rewrite:

- TODO: Flash Player no longer bundled.

- Scripting:
  - Some commands renamed for better clarity and consistency.
  - Conditionals: `cmd.if`, `cmd.if_all`, and `cmd.if_any` now take condition expressions and manage full blocks with `cmd.else`/`cmd.end_if`. Expressions can be built from built-in checks, custom `cmd.x(...)` checks, and `cmd.and`/`cmd.or`/`cmd.not`.
  - Custom commands: new shape and API, no longer subclass-based.
- AutoRelogin: removed fallback server.