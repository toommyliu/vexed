---
outline: deep
---
# Server

Represents a game server.

## Properties

### maxPlayers
*Getter*

The maximum number of players


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### port
*Getter*

The port number the server is on


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### langCode
*Getter*

The language of the server (en/xx/it/pt)


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

### name
*Getter*

The name of the server


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

### ip
*Getter*

The IP address of the server


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

### playerCount
*Getter*

The number of current players


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

## Methods

### isUpgrade
Signature: `isUpgrade()`

Whether the server is an upgrade-only server


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code>

### isCanned
Signature: `isCanned()`

The chat-level restriction of the server (0=canned, 2=free)


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code>