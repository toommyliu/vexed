---
outline: deep
---

# Player

---

### Properties

#### bot

Type: [Bot](.Bot.md)

#### factions

​<Badge type="info">getter</Badge>The player's faction data.

Type: [Faction](.Faction.md)[]

#### className

​<Badge type="info">getter</Badge>The name of the player's equipped class.

Type: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

#### state

​<Badge type="info">getter</Badge>The state of the player.

Type: [PlayerState](./typedefs/PlayerState.md)

#### hp

​<Badge type="info">getter</Badge>The health of the player.

Type: [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

#### maxHp

​<Badge type="info">getter</Badge>The maximum health of the player.

Type: [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

#### alive

​<Badge type="info">getter</Badge>Whether the player is alive.

Type: [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### mp

​<Badge type="info">getter</Badge>The mana of the player.

Type: [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

#### maxMp

​<Badge type="info">getter</Badge>The maximum mana of the player.

Type: [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

#### level

​<Badge type="info">getter</Badge>The level of the player.

Type: [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

#### gold

​<Badge type="info">getter</Badge>The player's gold.

Type: [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

#### position

​<Badge type="info">getter</Badge>The player's current position.

Type: [number, number]

#### cell

​<Badge type="info">getter</Badge>The cell the player is in, in the map.

Type: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

#### pad

​<Badge type="info">getter</Badge>The pad the player is in, in the map.

Type: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

### Methods

#### isAFK

Whether the player is AFK.

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### isMember

Whether the player has an active membership.

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### walkTo

Walks to a position on the map.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `x` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The x coordinate to walk to. |
| `y` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The y coordinate to walk to. |

**Returns:** [void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)

#### isLoaded

Whether the player has fully loaded in.

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### isReady

Comprehensive check to determine if the player is ready.

**Remarks:** This checks if the player is logged in, the world has loaded, and the player has fully loaded in.

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

