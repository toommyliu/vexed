---
outline: deep
---
# Player



## Properties

### factions
*Getter*

Get the player's factions data.


Return type: <code><a href="/api/struct/faction">Faction[]</a></code>

### className
*Getter*

Gets the name of the player's equipped class.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

### state
*Getter*

Gets the state of the current player.


Return type: <code><a href="/api/enums/playerstate">PlayerState</a></code>

### hp
*Getter*

Gets the current health of the current player.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### maxHP
*Getter*

Gets the maximum health of the current player.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### alive
*Getter*

Checks if the current player is alive.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code>

### mp
*Getter*

Gets the current mana of the current player.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### maxMP
*Getter*

Gets the maximum mana of the current player.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### level
*Getter*

Gets the level of the current player.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### gold
*Getter*

Gets the gold of the current player.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### afk
*Getter*

Checks if the current player is AFK.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code>

### position
*Getter*

The player's current position.


Return type: `{x: number, y: number}`

### cell
*Getter*

Get the cell of the current player in the map.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

### pad
*Getter*

Get the pad of the current player in the map.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

## Methods

### isMember
Signature: `isMember()`

Checks if the current player has membership.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code>

### walkTo
Signature: `walkTo(x: number, y: number)`

Walk to a position in the map.


Return type: `void`