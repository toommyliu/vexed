---
outline: deep
---
# World





## Properties

### players <Badge text="getter" />
Gets all players in the current map.


Return type: <code><a href="/api/struct/avatar">Avatar[]</a></code>

### monsters <Badge text="getter" />
The monsters in the map.


Return type: `MonsterData[]`

### visibleMonsters <Badge text="getter" />
Gets all visible monsters in the current cell.


Return type: <code><a href="/api/struct/monster">Monster[]</a></code>

### availableMonsters <Badge text="getter" />
Gets all available monsters in the current cell.


Return type: <code><a href="/api/struct/monster">Monster[]</a></code>

### loading <Badge text="getter" />
Checks if the map is still loading.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code>

### cells <Badge text="getter" />
Gets all cells of the map.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string[]</a></code>

### cellPads <Badge text="getter" /> <Badge text="setter" />
Get cell pads.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string[]</a></code>

### roomID <Badge text="getter" />
Gets the internal room ID of the current map.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### roomNumber <Badge text="getter" />
Gets the room number of the current map.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### name <Badge text="getter" />
Gets the name of the current map.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

## Methods

### isMonsterAvailable
Whether a monster is available.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| monsterResolvable | string |  |



**Returns:** <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code> 

### reload
Reloads the map.



**Returns:** `void` 

### jump
Jump to the specified cell and pad of the current map.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| cell | string |  |
| pad | string |  |
| force | boolean |  |
| tries | number |  |



**Returns:** `Promise<void>` 

### join
Joins a map.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| mapName | string |  |
| cell | string |  |
| pad | string |  |
| tries | number |  |



**Returns:** `Promise<void>` 

### goto
Goto the specified player.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| name | string |  |



**Returns:** `void` 

### isActionAvailable
Whether the game action has cooled down.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| action | GameAction |  |



**Returns:** <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code> 

### getMapItem
Gets a item in the world.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemID | string |  |



**Returns:** `Promise<void>` 

### loadMap
Loads a particular swf of the map.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| mapSWF | string |  |



**Returns:** `void` 