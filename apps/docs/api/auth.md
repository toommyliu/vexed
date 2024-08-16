---
title: Auth
outline: deep
---
# Auth





## Properties

### username<Badge text="getter" />
The username of the current user. This value is set after a successful login.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>

### password<Badge text="getter" />
The password of the current user. This value is set after a successful login.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>

### loggedIn<Badge text="getter" />
Whether the user is logged in and connected to a server.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

### servers<Badge text="getter" />
The list of servers as shown to the client. The list is updated after a successful login.

Type: <code><a href="/api/struct/server">Server</a>[]</code>

### ip<Badge text="getter" />
The server IP the client is connected to.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>

### port<Badge text="getter" />
The server port the client is connected to.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code>

### isTemporarilyKicked<Badge text="getter" />
Whether the client is temporarily kicked from the server.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

## Methods

### login
Log in with the given account or the previous account (if available).
| Parameter | Type | Optional | Description |
| --------- | ---- | -------- | ----------- |
| username | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | ✅ | The username to login with. |
| password | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | ✅ | The password to login with. |

**Returns:** `void`

### logout
Logs out of the current account.

**Returns:** `void`

### resetServers
Resets the list of servers that is available to the client.

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

### connectTo
Connects to a server.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| name | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | The name of the server. |

**Returns:** `void`
