# Combat



## Properties

### pauseAttack
<p>Whether to stop attacking because a counter attack is active.</p>

### target
<p>Returns information about the target.</p>


Return type: Record<string, unknown> | null

## Methods

### hasTarget
Signature: `hasTarget()`

Whether the player has a target.


Return type: boolean

### attack
Signature: `attack(monsterResolvable: string)`

Attacks a monster.


Return type: void

### cancelTarget
Signature: `cancelTarget()`

Cancels the current target.


Return type: void

### cancelAutoAttack
Signature: `cancelAutoAttack()`

Cancels an auto attack.


Return type: void