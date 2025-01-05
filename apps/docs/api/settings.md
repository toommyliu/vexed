---
outline: deep
---

# Settings

---

### Properties

#### counterAttack

Type: [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

Whether to automatically stop attacking a Counter Attack is active.

#### bot

Type: [Bot](.Bot.md)

#### infiniteRange

​<Badge type="info">getter</Badge>Whether Infinite Range is enabled.

​<Badge type="info">setter</Badge>Sets the state of Infinite Range.

Type: [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### provokeMap

​<Badge type="info">getter</Badge>Whether Provoke Map is enabled.

​<Badge type="info">setter</Badge>Sets the state of Provoke Map.

Type: [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### provokeCell

​<Badge type="info">getter</Badge>Whether Provoke Cell is enabled.

​<Badge type="info">setter</Badge>Sets the state of Provoke Cell.

Type: [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### enemyMagnet

​<Badge type="info">getter</Badge>Whether Enemy Magnet is enabled.

​<Badge type="info">setter</Badge>Sets the state of Enemy Magnet.

Type: [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### lagKiller

​<Badge type="info">getter</Badge>Whether Lag Killer is enabled.

​<Badge type="info">setter</Badge>Sets the state of Lag Killer.

Type: [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### hidePlayers

​<Badge type="info">getter</Badge>Whether Hide Players is enabled.

​<Badge type="info">setter</Badge>Sets the state of Hide Players.

Type: [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### skipCutscenes

​<Badge type="info">getter</Badge>Whether Skip Cutscenes is enabled.

​<Badge type="info">setter</Badge>Sets the state of Skip Cutscenes.

Type: [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### walkSpeed

​<Badge type="info">getter</Badge>The player's walk speed.

​<Badge type="info">setter</Badge>Sets the player's walk speed.

Type: [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

### Methods

#### setFps

Sets the client target fps.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `fps` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The target fps. |

**Returns:** [void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)

#### setDeathAds

Sets the visibility of death ads.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `on` | [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | If true, shows death ads. Otherwise, they are hidden. |

**Returns:** [void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)

