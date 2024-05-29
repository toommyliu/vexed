<a name="Server"></a>

## Server
A game server.

**Kind**: global class  

* [Server](#Server)
    * [new Server(data)](#new_Server_new)
    * [.maxPlayers](#Server+maxPlayers) ⇒ <code>number</code>
    * [.port](#Server+port) ⇒ <code>number</code>
    * [.langCode](#Server+langCode) ⇒ <code>string</code>
    * [.name](#Server+name) ⇒ <code>string</code>
    * [.ip](#Server+ip) ⇒ <code>string</code>
    * [.playerCount](#Server+playerCount) ⇒ <code>number</code>
    * [.isUpgrade](#Server+isUpgrade) ⇒ <code>boolean</code>
    * [.isCanned](#Server+isCanned) ⇒ <code>boolean</code>

<a name="new_Server_new"></a>

### new Server(data)

| Param | Type |
| --- | --- |
| data | [<code>ServerData</code>](#ServerData) | 

<a name="Server+maxPlayers"></a>

### server.maxPlayers ⇒ <code>number</code>
The maximum number of players

**Kind**: instance property of [<code>Server</code>](#Server)  
<a name="Server+port"></a>

### server.port ⇒ <code>number</code>
The port number the server is on

**Kind**: instance property of [<code>Server</code>](#Server)  
<a name="Server+langCode"></a>

### server.langCode ⇒ <code>string</code>
The language of the server (en/xx/it/pt)

**Kind**: instance property of [<code>Server</code>](#Server)  
<a name="Server+name"></a>

### server.name ⇒ <code>string</code>
The name of the server

**Kind**: instance property of [<code>Server</code>](#Server)  
<a name="Server+ip"></a>

### server.ip ⇒ <code>string</code>
The IP address of the server

**Kind**: instance property of [<code>Server</code>](#Server)  
<a name="Server+playerCount"></a>

### server.playerCount ⇒ <code>number</code>
The number of current players

**Kind**: instance property of [<code>Server</code>](#Server)  
<a name="Server+isUpgrade"></a>

### server.isUpgrade ⇒ <code>boolean</code>
Whether the server is an upgrade-only server

**Kind**: instance property of [<code>Server</code>](#Server)  
<a name="Server+isCanned"></a>

### server.isCanned ⇒ <code>boolean</code>
The chat-level restriction of the server (0=canned, 2=free)

**Kind**: instance property of [<code>Server</code>](#Server)  
