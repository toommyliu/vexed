---
outline: deep
---

# Auth

---

### Properties

#### bot

Type: [Bot](.Bot.md)

#### username

​<Badge type="info">getter</Badge>The username of the current user.

**Remarks:** This value is set after a successful login.

Type: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

#### password

​<Badge type="info">getter</Badge>The password of the current user.

**Remarks:** This value is set after a successful login.

Type: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

#### servers

​<Badge type="info">getter</Badge>The list of servers as shown to the client.

**Remarks:** The value is set after a successful login.

Type: [Server](.Server.md)[]

#### ip

​<Badge type="info">getter</Badge>The server IP the client is connected to.

Type: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

#### port

​<Badge type="info">getter</Badge>The server port the client is connected to.

Type: [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

### Methods

#### isLoggedIn

Whether the user is logged in and connected to a server.

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### login

Log in with the given account or the previous account.

**Remarks:** If username and password are not provided, the client will attempt to login
with the values stored in the client.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `username` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [null](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/null) | ✓ | `null` | The username to login with. |
| `password` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [null](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/null) | ✓ | `null` | The password to login with. |

**Returns:** [void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)

#### logout

Logs out of the current account.

**Returns:** [void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)

#### resetServers

Resets the list of servers that is available to the client.

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### connectTo

Connects to a server.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `name` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | The name of the server. |

**Returns:** [void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)

#### isTemporarilyKicked

Whether the client is temporarily kicked from the server.

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

