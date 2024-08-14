---
outline: deep
---
# Combat

A `monsterResolvable` is either its name or monMapID prefixed with `id` and delimited by a `'`, `.`, `:`, `-` character



## Properties

### pauseAttack
Whether to stop attacking because a counter attack is active.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code>

### target <Badge text="getter" />
Returns information about the target.


Return type: `Record<string, unknown> | null`

## Methods

### hasTarget
Whether the player has a target.



**Returns:** <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code> 

### useSkill
Uses a skill.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| index | string \| number |  |
| force | boolean |  |
| wait | boolean |  |



**Returns:** `Promise<void>` 

### attack
Attacks a monster.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| monsterResolvable | string |  |



**Returns:** `void` 

### cancelTarget
Cancels the current target.



**Returns:** `void` 

### cancelAutoAttack
Cancels an auto attack.



**Returns:** `void` 

### kill
Kills a monster.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| monsterResolvable | string |  |
| config | KillConfig |  |



**Returns:** `Promise<void>` 

### killForItem
Kills the monster until the expected quantity of the item is collected in the Inventory.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| monsterResolvable | string |  |
| itemName | string |  |
| targetQty | number |  |
| killConfig | KillConfig |  |



**Returns:** `Promise<void>` 

### killForTempItem
Kills the monster until the expected quantity of the item is collected in the Temp Inventory.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| monsterResolvable | string |  |
| itemName | string |  |
| targetQty | number |  |
| killConfig | KillConfig |  |



**Returns:** `Promise<void>` 

### exit
Attempts to exit from combat.



**Returns:** `Promise<void>` 