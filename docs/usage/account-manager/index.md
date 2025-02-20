---
outline: deep
---

# Account Manager

Effortlessly manage and switch between multiple game accounts, streamling opening multiple clients and logging in at once.

You can open the account manager by clicking the tray icon and selecting **Open Account Manager**.

You can also set the default launch mode for the app by editing `Documents/Vexed/settings.json`.

```json
{
  "launchMode": "game" // default [!code --]
  "launchMode": "manager" // [!code ++]
}
```

::: warning

Accounts are stored in plaintext json under `Documents/Vexed/accounts.json` where you can edit them manually as needed.
