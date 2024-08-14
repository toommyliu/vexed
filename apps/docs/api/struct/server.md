---
outline: deep
---
# Server

Represents a game server.



## Properties

### data
Data about this server


Return type: <code><a href="/api/typedefs/serverdata">ServerData</a></code>

### maxPlayers <Badge text="getter" />
The maximum number of players


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### port <Badge text="getter" />
The port number the server is on


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### langCode <Badge text="getter" />
The language of the server (en/xx/it/pt)


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

### name <Badge text="getter" />
The name of the server


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

### ip <Badge text="getter" />
The IP address of the server


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

### playerCount <Badge text="getter" />
The number of current players


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

## Methods

### isUpgrade
Whether the server is an upgrade-only server



**Returns:** <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code> 

### isCanned
The chat-level restriction of the server (0=canned, 2=free)



**Returns:** <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code> 