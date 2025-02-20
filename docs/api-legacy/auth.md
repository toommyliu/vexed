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

### Methods

#### isLoggedIn

Whether the user is logged in and connected to a server.

**Returns:** `boolean`

#### login

Log in with an account.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `username` | `string` | The username to login with. |
| `password` | `string` | The password to login with. |

**Returns:** `void`

#### logout

Logs out of the current account.

**Returns:** `void`

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

