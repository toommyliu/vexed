---
outline: deep
---

# Combat 

A `monsterResolvable` is either a monster name or monMapID prefixed with `id` and delimited by a `'`, `.`, `:`, `-` character.

---

### Properties

#### pauseAttack

Type: `boolean`

#### bot

Type: `Bot`

#### target

​<Badge type="info">getter</Badge>Returns information about the target.

Type: `Record<string, unknown> | null`

### Methods

#### hasTarget

Whether the player has a target.

**Returns:** `boolean`

#### useSkill

Casts a skill.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `index` | `string \| number` |  |  | The index of the skill. Skills range from 0 (skill 1) to 5 (potions). |
| `force` | `boolean` | ✓ | `false` | Whether to use the skill regardless if there is a target. |
| `wait` | `boolean` | ✓ | `false` | Whether to wait for the skill to be available. |

**Returns:** `Promise<void>`

#### attack

Attacks a monster.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `monsterResolvable` | `string` | The name or monMapID of the monster. |

**Returns:** `void`

#### cancelTarget

Cancels the current target.

**Returns:** `void`

#### cancelAutoAttack

Cancels an auto attack.

**Returns:** `void`

#### kill

Kills a monster.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `monsterResolvable` | `string` |  |  | The name or monMapId of the monster. |
| `options` | `Partial<KillOptions>` | ✓ | `{}` | The optional configuration to use for the kill. |

**Returns:** `Promise<void>`

#### killForItem

Kills the monster until the quantity of the item is met in the inventory.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `monsterResolvable` | `string` |  |  | The name or monMapID of the monster. |
| `itemName` | `string` |  |  | The name or ID of the item. |
| `targetQty` | `number` |  |  | The quantity of the item. |
| `options` | `Partial<KillOptions>` | ✓ | `{}` | The configuration to use for the kill. |

**Returns:** `Promise<void>`

#### killForTempItem

Kills the monster until the quantity of the item is met in the temp inventory.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `monsterResolvable` | `string` |  |  | The name or monMapID of the monster. |
| `itemName` | `string` |  |  | The name or ID of the item. |
| `targetQty` | `number` |  |  | The quantity of the item. |
| `options` | `Partial<KillOptions>` | ✓ | `{}` | The configuration to use for the kill. |

**Returns:** `Promise<void>`

#### rest

Rests the player.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `full` | `boolean` | ✓ | `false` | Whether to rest until max hp and mp are reached. |
| `exit` | `boolean` | ✓ | `false` | Whether to exit combat before attempting to rest. |

**Returns:** `Promise<void>`

#### exit

Attempts to exit from combat.

**Returns:** `Promise<void>`

