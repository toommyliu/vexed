---
outline: deep
---

# LoadoutConfig ​<Badge type="info">extends Config</Badge>

---

### Methods

#### getPlayerItem

Get a player's loadout for a specific item type.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `playerNumber` | `number` |  |  | The player number (1-n) |
| `itemType` | `keyof Loadout` |  |  | The type of item (Class, Weapon, Helm, Cape, etc.) |
| `defaultValue` | `string` | ✓ | `""` | The default value to return if not found |

**Returns:** `string`

#### setPlayerItem

Set a player's loadout for a specific item type.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `playerNumber` | `number` | The player number (1-n) |
| `itemType` | `keyof Loadout` | The type of item (Class, Weapon, Helm, Cape, etc.) |
| `value` | `string` | The value to set |

**Returns:** `void`

#### getPlayerLoadout

Get all items for a specific player.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `playerNumber` | `number` | The player number (1-n) |

**Returns:** `Loadout`

#### setPlayerLoadout

Set a complete loadout for a player.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `playerNumber` | `number` | The player number (1-n) |
| `loadout` | `Loadout` | An object containing the player's loadout |

**Returns:** `void`

