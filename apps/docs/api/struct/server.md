---
title: Server
outline: deep
---
# Server

Represents a game server.



## Properties

### data
Data about this server.

Type: <code><a href="/api/typedefs/serverdata">ServerData</a></code>

### maxPlayers<Badge text="getter" />
The maximum number of players.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code>

### port<Badge text="getter" />
The port number the server is on.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code>

### langCode<Badge text="getter" />
The language of the server (en/xx/it/pt).

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>

### name<Badge text="getter" />
The name of the server.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>

### ip<Badge text="getter" />
The IP address of the server.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>

### playerCount<Badge text="getter" />
The number of current players.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code>

## Methods

### isUpgrade
Whether the server is an upgrade-only server.

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

### isCanned
The chat-level restriction of the server (0=canned, 2=free).

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>
