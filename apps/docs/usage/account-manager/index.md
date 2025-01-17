---
outline: deep
---

# Account Manager

Effortlessly manage and switch between multiple game accounts, streamling opening multiple clients and logging in at once.

As of writing, the account manager is only accessible through the `launchMode` flag in `settings.json`.

```json
{
  "launchMode": "game" // default // [!code --]
  "launchMode": "manager" // [!code ++]
}
```

Keep track of future development on this: [#73](https://github.com/toommyliu/vexed/issues/73) [#77](https://github.com/toommyliu/vexed/issues/77)

::: warning

Accounts are stored in plaintext json under `Documents/Vexed/accounts.json` where you can edit them manually as needed.
