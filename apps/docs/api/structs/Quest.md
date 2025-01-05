---
outline: deep
---

# Quest

Represents a quest.

---

### Properties

#### data

Type: `QuestData`

#### name

​<Badge type="info">getter</Badge>The name of this quest.

Type: `string`

#### id

​<Badge type="info">getter</Badge>The ID of this quest.

Type: `number`

#### inProgress

​<Badge type="info">getter</Badge>Whether this quest is in progress.

Type: `boolean`

#### once

​<Badge type="info">getter</Badge>Whether this quest can only be completed once.

Type: `boolean`

#### rewards

​<Badge type="info">getter</Badge>The rewards for completing this quest.

Type: `QuestReward[]`

#### requirements

​<Badge type="info">getter</Badge>The requirements needed to complete this quest.

Type: `QuestRequiredItem[]`

### Methods

#### canComplete

Whether this quest can be completed.

**Remarks:** The following checks are performed:
- The quest is not time-gated (daily, weekly, monthly)
- The player has an active membership.
- The quest is unlocked (e.g storyline).
- The player meets the level requirements.
- The player meets the class rank requirements.
- The player meets the faction rank requirements.
- The player has the required items.

**Returns:** `boolean`

#### isAvailable

Whether this quest is available.

**Returns:** `boolean`

#### isUpgrade

Whether this quest requires membership to accept.

**Returns:** `boolean`

#### hasCompletedBefore

Whether this quest has been completed before.

**Returns:** `boolean`

#### isDaily

Whether this quest is a daily quest.

**Returns:** `boolean`

#### isWeekly

Whether this quest is a weekly quest.

**Returns:** `boolean`

#### isMonthly

Whether this quest is a monthly quest.

**Returns:** `boolean`

