---
outline: deep
---

# Combat

A `monsterResolvable` is either a monster name or monMapID prefixed with `id` and delimited by a `'`, `.`, `:`, `-` character.

---

### Properties

#### pauseAttack

Type: [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### bot

Type: [Bot](.Bot.md)

#### target

​<Badge type="info">getter</Badge>Returns information about the target.

Type: [Record](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)<[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String), unknown> | [null](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/null)

### Methods

#### hasTarget

Whether the player has a target.

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### useSkill

Casts a skill.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `index` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) |  |  | The index of the skill. Skills range from 0 (skill 1) to 5 (potions). |
| `force` | [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | ✓ | `false` | Whether to use the skill regardless if there is a target. |
| `wait` | [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | ✓ | `false` | Whether to wait for the skill to be available. |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

#### attack

Attacks a monster.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `monsterResolvable` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | The name or monMapID of the monster. |

**Returns:** [void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)

#### cancelTarget

Cancels the current target.

**Returns:** [void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)

#### cancelAutoAttack

Cancels an auto attack.

**Returns:** [void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)

#### kill

Kills a monster.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `monsterResolvable` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) |  |  | The name or monMapId of the monster. |
| `options` | Partial<[KillOptions](./typedefs/KillOptions.md)> | ✓ | `{}` | The optional configuration to use for the kill. |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

#### killForItem

Kills the monster until the quantity of the item is met in the inventory.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `monsterResolvable` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) |  |  | The name or monMapID of the monster. |
| `itemName` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) |  |  | The name or ID of the item. |
| `targetQty` | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) |  |  | The quantity of the item. |
| `options` | Partial<[KillOptions](./typedefs/KillOptions.md)> | ✓ | `{}` | The configuration to use for the kill. |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

#### killForTempItem

Kills the monster until the quantity of the item is met in the temp inventory.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `monsterResolvable` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) |  |  | The name or monMapID of the monster. |
| `itemName` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) |  |  | The name or ID of the item. |
| `targetQty` | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) |  |  | The quantity of the item. |
| `options` | Partial<[KillOptions](./typedefs/KillOptions.md)> | ✓ | `{}` | The configuration to use for the kill. |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

#### rest

Rests the player.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `full` | [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | ✓ | `false` | Whether to rest until max hp and mp are reached. |
| `exit` | [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | ✓ | `false` | Whether to exit combat before attempting to rest. |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

#### exit

Attempts to exit from combat.

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

