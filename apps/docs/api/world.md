---
title: World
outline: deep
---
# World





## Properties

### players<Badge text="getter" />
Gets all players in the current map.

Type: <code><a href="/api/struct/avatar">Avatar</a>[]</code>

### monsters<Badge text="getter" />
The monsters in the map.

Type: <code><a href="/api/typedefs/monsterdata">MonsterData</a>[]</code>

### visibleMonsters<Badge text="getter" />
Gets all visible monsters in the current cell.

Type: <code><a href="/api/struct/monster">Monster</a>[]</code>

### availableMonsters<Badge text="getter" />
Gets all available monsters in the current cell.

Type: <code><a href="/api/struct/monster">Monster</a>[]</code>

### loading<Badge text="getter" />
Checks if the map is still loading.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

### cells<Badge text="getter" />
Gets all cells of the map.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a>[]</code>

### cellPads<Badge text="getter" />
Get cell pads.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a>[]</code>

### roomID<Badge text="getter" />
Gets the internal room ID of the current map.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code>

### roomNumber<Badge text="getter" />
Gets the room number of the current map.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code>

### name<Badge text="getter" />
Gets the name of the current map.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>

### itemTree<Badge text="getter" />
The list of all items in the world.

Type: `InventoryItemData[]`

## Methods

### isMonsterAvailable
Whether a monster is available.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| monsterResolvable | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | The name of the monster or in monMapID format. |

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

### reload
Reloads the map.

**Returns:** `void`

### setSpawnPoint
Sets the local player's spawnpoint to the current cell and pad.

**Returns:** `void`

### jump
Jump to the specified cell and pad of the current map.
| Parameter | Type | Optional | Default | Description |
---------- | ---- | -------- | ------- | ----------- |
| cell | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> |  |  | The cell to jump to. |
| pad | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | ✅ | "Spawn" | The pad to jump to. |
| force | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code> | ✅ | false | Whether to allow jumping to the same cell. |
| tries | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | ✅ | 5 | The number of times to try jumping. |

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/promise">Promise</a>&lt;void&gt;</code>

### join
Joins a map.
| Parameter | Type | Optional | Default | Description |
---------- | ---- | -------- | ------- | ----------- |
| mapName | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> |  |  | The name of the map to join. |
| cell | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | ✅ | "Enter" | The cell to jump to. |
| pad | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | ✅ | "Spawn" | The pad to jump to. |
| tries | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | ✅ | 5 | Number of attempts to try and join the map |

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/promise">Promise</a>&lt;void&gt;</code>

### goto
Goto the specified player.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| name | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | The name of the player to goto. |

**Returns:** `void`

### isActionAvailable
Whether the game action has cooled down.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| action | <code><a href="/api/enums/gameaction">GameAction</a></code> | The game action to check. |

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

### getMapItem
Gets a item in the world.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemID | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | The ID of the item. |

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/promise">Promise</a>&lt;void&gt;</code>

### loadMap
Loads a particular swf of the map.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| mapSWF | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | The swf to load. |

**Returns:** `void`
