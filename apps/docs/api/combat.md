---
outline: deep
---
# Combat

A `monsterResolvable` is either its name or monMapID prefixed with `id` and delimited by a `'`, `.`, `:`, `-` character

## Properties

### pauseAttack
Whether to stop attacking because a counter attack is active.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code>

### target
*Getter*

Returns information about the target.


Return type: `Record<string, unknown> | null`

## Methods

### hasTarget
Signature: `hasTarget()`

Whether the player has a target.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code>

### useSkill
Signature: `useSkill(index: string | number, force: boolean, wait: boolean)`

Uses a skill.


Return type: `Promise<void>`

### attack
Signature: `attack(monsterResolvable: string)`

Attacks a monster.


Return type: `void`

### cancelTarget
Signature: `cancelTarget()`

Cancels the current target.


Return type: `void`

### cancelAutoAttack
Signature: `cancelAutoAttack()`

Cancels an auto attack.


Return type: `void`

### kill
Signature: `kill(monsterResolvable: string, config: KillConfig)`

Kills a monster.


Return type: `Promise<void>`

### killForItem
Signature: `killForItem(monsterResolvable: string, itemName: string, targetQty: number, killConfig: KillConfig)`

Kills the monster until the expected quantity of the item is collected in the Inventory.


Return type: `Promise<void>`

### killForTempItem
Signature: `killForTempItem(monsterResolvable: string, itemName: string, targetQty: number, killConfig: KillConfig)`

Kills the monster until the expected quantity of the item is collected in the Temp Inventory.


Return type: `Promise<void>`

### exit
Signature: `exit()`

Attempts to exit from combat.


Return type: `Promise<void>`