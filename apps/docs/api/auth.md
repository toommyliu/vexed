<a name="Auth"></a>

## Auth
**Kind**: global class  

* [Auth](#Auth)
    * [new Auth(bot)](#new_Auth_new)
    * [.username](#Auth+username) ⇒ <code>string</code>
    * [.password](#Auth+password) ⇒ <code>string</code>
    * [.loggedIn](#Auth+loggedIn) ⇒ <code>boolean</code>
    * [.servers](#Auth+servers) ⇒ [<code>Array.&lt;Server&gt;</code>](#Server)
    * [.ip](#Auth+ip) ⇒ <code>string</code>
    * [.port](#Auth+port) ⇒ <code>number</code>
    * [.login([username], [password])](#Auth+login) ⇒ <code>void</code>
    * [.logout()](#Auth+logout) ⇒ <code>void</code>
    * [.resetServers()](#Auth+resetServers) ⇒ <code>boolean</code>
    * [.connect(name)](#Auth+connect) ⇒ <code>void</code>

<a name="new_Auth_new"></a>

### new Auth(bot)

| Param | Type |
| --- | --- |
| bot | <code>Bot</code> | 

<a name="Auth+username"></a>

### auth.username ⇒ <code>string</code>
The username of the current user. This value is only updated after logging in.

**Kind**: instance property of [<code>Auth</code>](#Auth)  
<a name="Auth+password"></a>

### auth.password ⇒ <code>string</code>
The password of the current user. This value is only updated after logging in.

**Kind**: instance property of [<code>Auth</code>](#Auth)  
<a name="Auth+loggedIn"></a>

### auth.loggedIn ⇒ <code>boolean</code>
Whether the user is logged in and connected to a server.

**Kind**: instance property of [<code>Auth</code>](#Auth)  
<a name="Auth+servers"></a>

### auth.servers ⇒ [<code>Array.&lt;Server&gt;</code>](#Server)
The list of servers the client can see. This list is updated after a successful login.

**Kind**: instance property of [<code>Auth</code>](#Auth)  
<a name="Auth+ip"></a>

### auth.ip ⇒ <code>string</code>
The server IP the client is connected to.

**Kind**: instance property of [<code>Auth</code>](#Auth)  
<a name="Auth+port"></a>

### auth.port ⇒ <code>number</code>
The server port the client is connected to.

**Kind**: instance property of [<code>Auth</code>](#Auth)  
<a name="Auth+login"></a>

### auth.login([username], [password]) ⇒ <code>void</code>
Log in with the given account or the account cached in memory.

**Kind**: instance method of [<code>Auth</code>](#Auth)  

| Param | Type |
| --- | --- |
| [username] | <code>string</code> | 
| [password] | <code>string</code> | 

<a name="Auth+logout"></a>

### auth.logout() ⇒ <code>void</code>
Logs out of the current account.

**Kind**: instance method of [<code>Auth</code>](#Auth)  
<a name="Auth+resetServers"></a>

### auth.resetServers() ⇒ <code>boolean</code>
Resets the list of servers that is available to the client.

**Kind**: instance method of [<code>Auth</code>](#Auth)  
<a name="Auth+connect"></a>

### auth.connect(name) ⇒ <code>void</code>
Connects to a server.

**Kind**: instance method of [<code>Auth</code>](#Auth)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | The name of the server. |

