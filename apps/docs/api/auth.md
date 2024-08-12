---
outline: deep
---
# Auth



## Properties

### username
*Getter*

The username of the current user. This value is set after a successful login.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

### password
*Getter*

The password of the current user. This value is set after a successful login.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

### loggedIn
*Getter*

Whether the user is logged in and connected to a server.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code>

### servers
*Getter*

The list of servers as shown to the client. The list is updated after a successful login.


Return type: <code><a href="/api/struct/server">Server[]</a></code>

### ip
*Getter*

The server IP the client is connected to.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

### port
*Getter*

The server port the client is connected to.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

## Methods

### login
Signature: `login(username?: string, password?: string)`

Log in with the given account or the previous account (if available).


Return type: `void`

### logout
Signature: `logout()`

Logs out of the current account.


Return type: `void`

### resetServers
Signature: `resetServers()`

Resets the list of servers that is available to the client.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code>

### connectTo
Signature: `connectTo(name: string)`

Connects to a server.


Return type: `void`