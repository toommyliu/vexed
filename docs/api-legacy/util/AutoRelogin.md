---
outline: deep
---

# AutoRelogin 

---

### Properties

#### server

Type: `string | null`

The server name to connect to.

#### delay

Type: `number`

The delay after which a login attempt is made.

### Methods

#### setCredentials

Sets the credentials for auto-login.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `username` | `string` | The username to login with. |
| `password` | `string` | The password to login with. |
| `server` | `string` | The server name to connect to. |

**Returns:** `void`

