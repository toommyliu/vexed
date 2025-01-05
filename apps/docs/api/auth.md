---
outline: deep
---

# Auth

---

### Properties

#### bot

Type: `Bot`

#### username

​<Badge type="info">getter</Badge>The username of the current user.

**Remarks:** This value is set after a successful login.

Type: `string`

#### password

​<Badge type="info">getter</Badge>The password of the current user.

**Remarks:** This value is set after a successful login.

Type: `string`

#### servers

​<Badge type="info">getter</Badge>The list of servers as shown to the client.

**Remarks:** The value is set after a successful login.

Type: `Server[]`

#### ip

​<Badge type="info">getter</Badge>The server IP the client is connected to.

Type: `string`

#### port

​<Badge type="info">getter</Badge>The server port the client is connected to.

Type: `number`

### Methods

#### isLoggedIn

Whether the user is logged in and connected to a server.

**Returns:** `boolean`

#### login

Log in with the given account or the previous account.

**Remarks:** If username and password are not provided, the client will attempt to login
with the values stored in the client.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `username` | `string \| null` | ✓ | `null` | The username to login with. |
| `password` | `string \| null` | ✓ | `null` | The password to login with. |

**Returns:** `void`

#### logout

Logs out of the current account.

**Returns:** `void`

#### resetServers

Resets the list of servers that is available to the client.

**Returns:** `boolean`

#### connectTo

Connects to a server.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `name` | `string` | The name of the server. |

**Returns:** `void`

#### isTemporarilyKicked

Whether the client is temporarily kicked from the server.

**Returns:** `boolean`

