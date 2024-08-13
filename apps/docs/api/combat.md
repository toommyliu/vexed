---
outline: deep
---
# Combat



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