# import('./Bot')



## Properties

### username
<p>The username of the current user. This value is set after a successful login.</p>


Return type: string

### password
<p>The password of the current user. This value is set after a successful login.</p>


Return type: string

### loggedIn
<p>Whether the user is logged in and connected to a server.</p>


Return type: boolean

### servers
<p>The list of servers as shown to the client. The list is updated after a successful login.</p>


Return type: Server[]

### ip
<p>The server IP the client is connected to.</p>


Return type: string

### port
<p>The server port the client is connected to.</p>


Return type: number

## Methods

### login
Signature: `login(username?: string, password?: string)`

Log in with the given account or the previous account (if available).


Return type: void

### logout
Signature: `logout()`

Logs out of the current account.


Return type: void

### resetServers
Signature: `resetServers()`

Resets the list of servers that is available to the client.


Return type: boolean

### connectTo
Signature: `connectTo(name: string)`

Connects to a server.


Return type: void