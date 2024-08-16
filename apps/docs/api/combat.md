---
title: Combat
outline: deep
---
# Combat

A `monsterResolvable` is either a monster name or monMapID prefixed with `id` and delimited by a `'`, `.`, `:`, `-` character



## Properties

### target<Badge text="getter" />
Returns information about the target.

Type: <code>Record<string, unknown> | null</code>

## Methods

### hasTarget
Whether the player has a target.

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

### useSkill
Uses a skill.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| index | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>\|<code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The index of the skill. Skills range from 0 (skill 1) to 5 (potions). |
| force | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code> | Whether to use the skill regardless if there is a target. |
| wait | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code> | Whether to wait for the skill to be available. |

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/promise">Promise</a>&lt;void&gt;</code>

### attack
Attacks a monster.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| monsterResolvable | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | The name or monMapID of the monster. |

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
| monsterResolvable | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | The name or monMapID of the monster. |
| config | <code><a href="/api/typedefs/killconfig">KillConfig</a></code> | The configuration to use for the kill. |

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/promise">Promise</a>&lt;void&gt;</code>

### killForItem
Kills the monster until the expected quantity of the item is collected in the Inventory.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| monsterResolvable | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | The name or monMapID of the monster. |
| itemName | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | The name or ID of the item. |
| targetQty | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The quantity of the item. |
| killConfig | <code><a href="/api/typedefs/killconfig">KillConfig</a></code> | The configuration to use for the kill. |

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/promise">Promise</a>&lt;void&gt;</code>

### killForTempItem
Kills the monster until the expected quantity of the item is collected in the Temp Inventory.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| monsterResolvable | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | The name or monMapID of the monster. |
| itemName | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | The name or ID of the item. |
| targetQty | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The quantity of the item. |
| killConfig | <code><a href="/api/typedefs/killconfig">KillConfig</a></code> | The configuration to use for the kill. |

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/promise">Promise</a>&lt;void&gt;</code>

### exit
Attempts to exit from combat.

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/promise">Promise</a>&lt;void&gt;</code>
