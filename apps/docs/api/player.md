---
outline: deep
---
# Player





## Properties

### factions <Badge text="getter" />
Get the player's factions data.


Return type: <code><a href="/api/struct/faction">Faction[]</a></code>

### className <Badge text="getter" />
Gets the name of the player's equipped class.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

### state <Badge text="getter" />
Gets the state of the current player.


Return type: <code><a href="/api/enums/playerstate">PlayerState</a></code>

### hp <Badge text="getter" />
Gets the current health of the current player.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### maxHP <Badge text="getter" />
Gets the maximum health of the current player.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### alive <Badge text="getter" />
Checks if the current player is alive.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code>

### mp <Badge text="getter" />
Gets the current mana of the current player.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### maxMP <Badge text="getter" />
Gets the maximum mana of the current player.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### level <Badge text="getter" />
Gets the level of the current player.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### gold <Badge text="getter" />
Gets the gold of the current player.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### afk <Badge text="getter" />
Checks if the current player is AFK.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code>

### position <Badge text="getter" />
The player's current position.


Return type: `{x: number, y: number}`

### cell <Badge text="getter" />
Get the cell of the current player in the map.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

### pad <Badge text="getter" />
Get the pad of the current player in the map.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

## Methods

### isMember
Checks if the current player has membership.



**Returns:** <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code> 

### walkTo
Walk to a position in the map.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| x | number |  |
| y | number |  |



**Returns:** `void` 