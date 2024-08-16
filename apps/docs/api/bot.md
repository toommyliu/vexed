---
title: Bot
outline: deep
---
# Bot





## Properties

### autoRelogin


Type: <code><a href="/api/autorelogin">AutoRelogin</a></code>

### flash


Type: <code><a href="/api/flash">Flash</a></code>

### timerManager


Type: <code><a href="/api/timermanager">TimerManager</a></code>

### auth


Type: <code><a href="/api/auth">Auth</a></code>

### bank


Type: <code><a href="/api/bank">Bank</a></code>

### combat


Type: <code><a href="/api/combat">Combat</a></code>

### drops


Type: <code><a href="/api/drops">Drops</a></code>

### house


Type: <code><a href="/api/house">House</a></code>

### inventory


Type: <code><a href="/api/inventory">Inventory</a></code>

### player


Type: <code><a href="/api/player">Player</a></code>

### packets


Type: <code><a href="/api/packets">Packets</a></code>

### quests


Type: <code><a href="/api/quests">Quests</a></code>

### settings


Type: <code><a href="/api/settings">Settings</a></code>

### shops


Type: <code><a href="/api/shop">Shop</a></code>

### tempInventory


Type: <code><a href="/api/tempinventory">TempInventory</a></code>

### world


Type: <code><a href="/api/world">World</a></code>

### running<Badge text="getter" />
Whether the bot is running.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

## Methods

### sleep
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| ms | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The number of milliseconds to wait. |

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/promise">Promise</a>&lt;void&gt;</code>

### waitUntil
Waits until the condition is met.
| Parameter | Type | Optional | Default | Description |
---------- | ---- | -------- | ------- | ----------- |
| condition | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/function">Function</a></code> |  |  | The condition to wait for. |
| prerequisite | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/function">Function</a></code> | ✅ | null | The prerequisite to be checked before waiting for the condition. |
| timeout | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | ✅ | 15 | The maximum number of iterations to wait. -1 to wait indefinitely. |

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/promise">Promise</a>&lt;void&gt;</code>

### start
Raises the running flag. While this does not start a script, it setups various tasks used during a script's runtime. For example, the auto relogin background task.

**Returns:** `void`

### stop
Lowers the running flag. While this does not stop a script, it removes any background tasks that were set up on start.

**Returns:** `void`

### getInstance<Badge text="static" />
Gets the singleton instance of the Bot class.

**Returns:** <code><a href="/api/bot">Bot</a></code>
