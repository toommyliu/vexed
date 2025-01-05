---
outline: deep
---

# Quests

---

### Properties

#### bot

Type: [Bot](.Bot.md)

#### tree

​<Badge type="info">getter</Badge>A list of quests loaded in the client.

Type: [Quest](.Quest.md)[]

#### accepted

​<Badge type="info">getter</Badge>A list of accepted quests.

Type: [Quest](.Quest.md)[]

### Methods

#### get

Resolves for a Quest instance.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `questId` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The id of the quest. |

**Returns:** [Quest](.Quest.md) | [null](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/null)

#### load

Loads a quest.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `questId` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The quest id to load. |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

#### loadMultiple

Loads multiple quests at once.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `questIds` | [(string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)[] | List of quest ids to load |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

#### accept

Accepts a quest.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `questId` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The quest id to accept. |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

#### acceptMultiple

Accepts multiple quests concurrently.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `questIds` | [(string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)[] | List of quest ids to accept. |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

#### complete

Completes a quest.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `questId` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) |  |  | The quest id to complete. |
| `turnIns` | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | ✓ | `1` | The number of times to turn-in the quest. |
| `itemId` | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | ✓ | `-1` | The ID of the quest rewards to select. |
| `special` | [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | ✓ | `false` | Whether the quest is "special." |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

