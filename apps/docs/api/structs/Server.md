---
outline: deep
---

# Server 

Represents a game server.

---

### Properties

#### data

Type: `ServerData`

Data about this server.

#### maxPlayers

​<Badge type="info">getter</Badge>The maximum number of players.

Type: `number`

#### port

​<Badge type="info">getter</Badge>The port number the server is on.

Type: `number`

#### langCode

​<Badge type="info">getter</Badge>The language of the server (en/xx/it/pt).

Type: `string`

#### name

​<Badge type="info">getter</Badge>The name of the server.

Type: `string`

#### ip

​<Badge type="info">getter</Badge>The IP address of the server.

Type: `string`

#### playerCount

​<Badge type="info">getter</Badge>The number of current players.

Type: `number`

### Methods

#### isUpgrade

Whether the server is an upgrade-only server.

**Returns:** `boolean`

#### isCanned

The chat-level restriction of the server (0=canned, 2=free).

**Returns:** `boolean`

