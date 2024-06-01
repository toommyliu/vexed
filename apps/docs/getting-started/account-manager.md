# Account Manager

When you first launch Vexed, you will be prompted with an "accounts manager". You can add or remove accounts, as well as logging in and connecting to a game server automatically.

Account data is stored in json at `Documents/Vexed/accounts.json`.

::: warning

Accounts are stored in plaintext json!

:::

If you do not want to use the account manager, you can create a `game.txt` file under `Documents/Vexed`. As long as this file exists, it will create a game window instead on launch.

::: tip

The implementation in choosing between the account manager and game window is still being decided. For now, this will suffice.

:::