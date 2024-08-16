---
title: Player
outline: deep
---
# Player





## Properties

### factions<Badge text="getter" />
Get the player's factions data.

Type: <code><a href="/api/struct/faction">Faction</a>[]</code>

### className<Badge text="getter" />
Gets the name of the player's equipped class.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>

### state<Badge text="getter" />
Gets the state of the current player.

Type: <code><a href="/api/enums/playerstate">PlayerState</a></code>

### hp<Badge text="getter" />
Gets the current health of the current player.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code>

### maxHP<Badge text="getter" />
Gets the maximum health of the current player.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code>

### alive<Badge text="getter" />
Checks if the current player is alive.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

### mp<Badge text="getter" />
Gets the current mana of the current player.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code>

### maxMP<Badge text="getter" />
Gets the maximum mana of the current player.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code>

### level<Badge text="getter" />
Gets the level of the current player.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code>

### gold<Badge text="getter" />
Gets the gold of the current player.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code>

### afk<Badge text="getter" />
Checks if the current player is AFK.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

### position<Badge text="getter" />
The player's current position.

Type: `{x: number, y: number}`

### cell<Badge text="getter" />
Get the cell of the current player in the map.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>

### pad<Badge text="getter" />
Get the pad of the current player in the map.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>

### loaded<Badge text="getter" />
A check for if the world is fully loaded, aswell as the player's inventory items and art.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

## Methods

### isMember
Whether the current player has membership.

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

### walkTo
Walk to a position in the map.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| x | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>\|<code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The x coordinate to walk to. |
| y | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>\|<code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The y coordinate to walk to. |

**Returns:** `void`
