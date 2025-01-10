---
outline: deep
---

# AutoRelogin 

Auto Relogins are automatically ran if the bot is running and there has been a selected server.
There are no calls needed to enable auto-relogin besides starting the bot and selecting the server to connect to.

---

### Properties

#### server

Type: `string | null`

The server name to connect to.

#### delay

Type: `number`

The delay after a logout or a disconnect before attempting to login.

#### bot

Type: `Bot`

