---
outline: deep
---

# World 

---

### Properties

#### bot

Type: `Bot`

#### playerNames

​<Badge type="info">getter</Badge>A list of all player names in the map.

Type: `string[]`

#### players

​<Badge type="info">getter</Badge>A list of all players in the map.

Type: `Map<string, Avatar> | null`

#### monsters

​<Badge type="info">getter</Badge>A list of monsters in the map.

Type: `MonsterData[]`

#### availableMonsters

​<Badge type="info">getter</Badge>A list of monsters in the cell.

Type: `Monster[]`

#### cells

​<Badge type="info">getter</Badge>A list of all cells in the map.

Type: `string[]`

#### cellPads

​<Badge type="info">getter</Badge>A list of valid pads for the current cell.

Type: `string[]`

#### roomId

​<Badge type="info">getter</Badge>The current room area id.

Type: `number`

#### roomNumber

​<Badge type="info">getter</Badge>The room number of the map.

Type: `number`

#### name

​<Badge type="info">getter</Badge>The name of the map.

Type: `string`

#### itemTree

​<Badge type="info">getter</Badge>The list of all items in the world.

Type: `ItemData[]`

### Methods

#### isMonsterAvailable

Whether a monster is available.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `monsterResolvable` | `string` | The name of the monster or in monMapID format. |

**Returns:** `boolean`

#### reload

Reloads the map.

**Returns:** `void`

#### isLoading

Whether the map is still being loaded.

**Returns:** `boolean`

#### setSpawnPoint

Sets the player's spawnpoint.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `cell` | `string \| undefined` | ✓ |  |  |
| `pad` | `string \| undefined` | ✓ |  |  |

**Returns:** `void`

#### jump

Jump to the specified cell and pad of the current map.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `cell` | `string` |  |  | The cell to jump to. |
| `pad` | `string` | ✓ | `"Spawn"` | The pad to jump to. |

**Returns:** `Promise<void>`

#### join

Joins a map.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `mapName` | `string` |  |  | The name of the map to join. |
| `cell` | `string` | ✓ | `"Enter"` | The cell to jump to. |
| `pad` | `string` | ✓ | `"Spawn"` | The pad to jump to. |

**Returns:** `Promise<void>`

#### goto

Goto the specified player.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `playerName` | `string` | The name of the player to goto. |

**Returns:** `void`

#### isActionAvailable

Whether the game action has cooled down.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `gameAction` | `GameAction` | The game action to check. |

**Returns:** `boolean`

#### getMapItem

Gets a item in the world.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `itemId` | `number` | The ID of the item. |

**Returns:** `Promise<void>`

#### loadMapSwf

Loads a particular swf of a map.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `mapSwf` | `string` | The swf to load. |

**Returns:** `void`

