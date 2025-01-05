---
outline: deep
---

# AutoRelogin

Auto Relogins are automatically ran if the bot is running and there has been a selected server.
There are no calls needed to enable auto-relogin besides starting the bot and selecting the server to connect to.

---

### Properties

#### server

Type: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | [null](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/null)

The server name to connect to.

#### delay

Type: [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

The delay after a logout or a disconnect before attempting to login.

#### bot

Type: [Bot](.Bot.md)

