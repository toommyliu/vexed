---
outline: deep
---

# Quests

---

### Properties

#### bot

Type: `Bot`

#### tree

​<Badge type="info">getter</Badge>A list of quests loaded in the client.

Type: `Quest[]`

#### accepted

​<Badge type="info">getter</Badge>A list of accepted quests.

Type: `Quest[]`

### Methods

#### get

Resolves for a Quest instance.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `questId` | `string \| number` | The id of the quest. |

**Returns:** `Quest | null`

#### load

Loads a quest.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `questId` | `string \| number` | The quest id to load. |

**Returns:** `Promise<void>`

#### loadMultiple

Loads multiple quests at once.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `questIds` | `(string \| number)[]` | List of quest ids to load |

**Returns:** `Promise<void>`

#### accept

Accepts a quest.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `questId` | `string \| number` | The quest id to accept. |

**Returns:** `Promise<void>`

#### acceptMultiple

Accepts multiple quests concurrently.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `questIds` | `(string \| number)[]` | List of quest ids to accept. |

**Returns:** `Promise<void>`

#### complete

Completes a quest.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `questId` | `string \| number` |  |  | The quest id to complete. |
| `turnIns` | `number` | ✓ | `1` | The number of times to turn-in the quest. |
| `itemId` | `number` | ✓ | `-1` | The ID of the quest rewards to select. |
| `special` | `boolean` | ✓ | `false` | Whether the quest is "special." |

**Returns:** `Promise<void>`

