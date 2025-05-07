---
outline: deep
---

# Avatar 

Represents a player in the world.

---

### Properties

#### data

Type: `AvatarData`

Data about this player.

#### cell

​<Badge type="info">getter</Badge>The cell the player is in.

Type: `string`

#### pad

​<Badge type="info">getter</Badge>The pad the player is in.

Type: `string`

#### hp

​<Badge type="info">getter</Badge>The player's current hp.

Type: `number`

#### maxHp

​<Badge type="info">getter</Badge>The player's max hp.

Type: `number`

#### mp

​<Badge type="info">getter</Badge>The player's current mp.

Type: `number`

#### maxMp

​<Badge type="info">getter</Badge>The player's max mp.

Type: `number`

#### level

​<Badge type="info">getter</Badge>The player's level.

Type: `number`

#### state

​<Badge type="info">getter</Badge>The player's current state.

Type: `0 | 2 | 1`

#### username

​<Badge type="info">getter</Badge>The player's username.

Type: `string`

#### auras

​<Badge type="info">getter</Badge>The player's active auras.

Type: `Aura[]`

### Methods

#### isHpLessThan

Whether the player's hp is less than a value.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `value` | `number` | The value to compare the player's hp to. |

**Returns:** `boolean`

#### isHpGreaterThan

Whether the player's hp is greater than a value.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `value` | `number` | The value to compare the player's hp to. |

**Returns:** `boolean`

#### isHpPercentageLessThan

Whether the player's hp is less than a percentage value.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `value` | `number` | The percentage value to compare the player's hp to. |

**Returns:** `boolean`

#### isHpPercentageGreaterThan

Whether the player's hp is greater than a percentage value.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `value` | `number` | The percentage value to compare the player's hp to. |

**Returns:** `boolean`

#### getAura

Retrieves an aura active on the player.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `name` | `string` | The aura name. |

**Returns:** `Aura | undefined`

#### hasAura

Whether the player has the specified aura. If a value is provided,
it will check if the aura has the specified value.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `name` | `string` |  |  | The aura name. |
| `value` | `number \| undefined` | ✓ |  | The value to check. |

**Returns:** `boolean`

#### isInCell

Whether the player is in the specified cell.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `cell` | `string` | The cell to check. |

**Returns:** `boolean`

#### isInCombat

Whether the player is in combat.

**Returns:** `boolean`

#### isDead

**Returns:** `boolean`

#### isIdle

Whether the player is idle.

**Returns:** `boolean`

