---
outline: deep
---

# Player 

---

### Properties

#### bot

Type: `Bot`

#### factions

​<Badge type="info">getter</Badge>The player's faction data.

Type: `Faction[]`

#### className

​<Badge type="info">getter</Badge>The name of the player's equipped class.

Type: `string`

#### state

​<Badge type="info">getter</Badge>The state of the player.

Type: `0 | 2 | 1`

#### hp

​<Badge type="info">getter</Badge>The health of the player.

Type: `number`

#### maxHp

​<Badge type="info">getter</Badge>The maximum health of the player.

Type: `number`

#### alive

​<Badge type="info">getter</Badge>Whether the player is alive.

Type: `boolean`

#### mp

​<Badge type="info">getter</Badge>The mana of the player.

Type: `number`

#### maxMp

​<Badge type="info">getter</Badge>The maximum mana of the player.

Type: `number`

#### level

​<Badge type="info">getter</Badge>The level of the player.

Type: `number`

#### gold

​<Badge type="info">getter</Badge>The player's gold.

Type: `number`

#### position

​<Badge type="info">getter</Badge>The player's current position.

Type: `[number, number]`

#### cell

​<Badge type="info">getter</Badge>The cell the player is in, in the map.

Type: `string`

#### pad

​<Badge type="info">getter</Badge>The pad the player is in, in the map.

Type: `string`

### Methods

#### isInCombat

Whether the player is in combat.

**Returns:** `boolean`

#### isAFK

Whether the player is AFK.

**Returns:** `boolean`

#### isMember

Whether the player has an active membership.

**Returns:** `boolean`

#### walkTo

Walks to a position on the map.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `x` | `string \| number` |  |  | The x coordinate to walk to. |
| `y` | `string \| number` |  |  | The y coordinate to walk to. |
| `walkSpeed` | `string \| number \| undefined` | ✓ |  | The speed to walk at. |

**Returns:** `void`

#### isLoaded

Whether the player has fully loaded in.

**Returns:** `boolean`

#### isReady

Comprehensive check to determine if the player is ready.

**Remarks:** This checks if the player is logged in, the world has loaded, and the player has fully loaded in.

**Returns:** `boolean`

#### isBoostActive

Checks if the player has an active boost.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `type` | `"gold" \| "exp" \| "rep" \| "classPoints"` | The type of boost to check. |

**Returns:** `boolean`

#### equipLoadout

Equips a loadout for the player.

**Remarks:** A loadout is to be read from file, not the player's outfits.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `loadout` | `Loadout` | The loadout to equip. |

**Returns:** `Promise<void>`

