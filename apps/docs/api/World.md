---
outline: deep
---

# World

---

### Properties

#### bot

Type: [Bot](.Bot.md)

#### players

​<Badge type="info">getter</Badge>A list of all players in the map.

Type: [Avatar](.Avatar.md)[]

#### monsters

​<Badge type="info">getter</Badge>A list of monsters in the map.

Type: [MonsterData](./typedefs/MonsterData.md)[]

#### visibleMonsters

​<Badge type="info">getter</Badge>A list of visible monsters in the cell.

Type: [Monster](.Monster.md)[]

#### availableMonsters

​<Badge type="info">getter</Badge>A list of available monsters in the cell.

Type: [Monster](.Monster.md)[]

#### cells

​<Badge type="info">getter</Badge>A list of all cells in the map.

Type: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)[]

#### cellPads

​<Badge type="info">getter</Badge>A list of valid pads for the current cell.

Type: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)[]

#### roomId

​<Badge type="info">getter</Badge>The current room area id.

Type: [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

#### roomNumber

​<Badge type="info">getter</Badge>The room number of the map.

Type: [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

#### name

​<Badge type="info">getter</Badge>The name of the map.

Type: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

#### itemTree

​<Badge type="info">getter</Badge>The list of all items in the world.

Type: [ItemData](./typedefs/ItemData.md)[]

### Methods

#### isMonsterAvailable

Whether a monster is available.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `monsterResolvable` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | The name of the monster or in monMapID format. |

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### reload

Reloads the map.

**Returns:** [void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)

#### isLoading

Whether the map is still being loaded.

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### setSpawnPoint

Sets the player's spawnpoint.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `cell` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| undefined | ✓ |  |  |
| `pad` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| undefined | ✓ |  |  |

**Returns:** [void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)

#### jump

Jump to the specified cell and pad of the current map.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `cell` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) |  |  | The cell to jump to. |
| `pad` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | ✓ | `"Spawn"` | The pad to jump to. |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

#### join

Joins a map.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `mapName` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) |  |  | The name of the map to join. |
| `cell` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | ✓ | `"Enter"` | The cell to jump to. |
| `pad` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | ✓ | `"Spawn"` | The pad to jump to. |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

#### goto

Goto the specified player.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `playerName` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | The name of the player to goto. |

**Returns:** [void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)

#### isActionAvailable

Whether the game action has cooled down.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `gameAction` | [GameAction](./typedefs/GameAction.md) | The game action to check. |

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### getMapItem

Gets a item in the world.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `itemId` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | The ID of the item. |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

#### loadMapSwf

Loads a particular swf of a map.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `mapSwf` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | The swf to load. |

**Returns:** [void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)

