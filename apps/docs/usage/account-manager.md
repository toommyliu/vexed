# Account Manager

When you first launch Vexed, you will be prompted with an "accounts manager". You can add or remove accounts, as well as logging in and connecting to a game server automatically.

Account data is stored in json at `Documents/Vexed/accounts.json`.

::: warning

Accounts are stored in plaintext json!

:::

If you do not want to use the account manager, open Finder > Documents > Vexed > preferences.json. This file should already exist if you launched before.

Make sure the `launch` key is set to `game` like so:

```json
{
    "launch": "manager" // [!code --]
    "launch": "game" // [!code ++]
}
```
