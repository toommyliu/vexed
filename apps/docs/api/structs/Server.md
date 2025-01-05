---
outline: deep
---

# Server

Represents a game server.

---

### Properties

#### data

Type: [ServerData](./typedefs/ServerData.md)

Data about this server.

#### maxPlayers

​<Badge type="info">getter</Badge>The maximum number of players.

Type: [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

#### port

​<Badge type="info">getter</Badge>The port number the server is on.

Type: [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

#### langCode

​<Badge type="info">getter</Badge>The language of the server (en/xx/it/pt).

Type: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

#### name

​<Badge type="info">getter</Badge>The name of the server.

Type: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

#### ip

​<Badge type="info">getter</Badge>The IP address of the server.

Type: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

#### playerCount

​<Badge type="info">getter</Badge>The number of current players.

Type: [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

### Methods

#### isUpgraded

Whether the server is an upgrade-only server.

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### isCanned

The chat-level restriction of the server (0=canned, 2=free).

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

