---
outline: deep
---

# Quest

Represents a quest.

---

### Properties

#### data

Type: [QuestData](./typedefs/QuestData.md)

#### name

​<Badge type="info">getter</Badge>The name of this quest.

Type: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

#### id

​<Badge type="info">getter</Badge>The ID of this quest.

Type: [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

#### inProgress

​<Badge type="info">getter</Badge>Whether this quest is in progress.

Type: [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### once

​<Badge type="info">getter</Badge>Whether this quest can only be completed once.

Type: [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### rewards

​<Badge type="info">getter</Badge>The rewards for completing this quest.

Type: [QuestReward](./typedefs/QuestReward.md)[]

#### requirements

​<Badge type="info">getter</Badge>The requirements needed to complete this quest.

Type: [QuestRequiredItem](./typedefs/QuestRequiredItem.md)[]

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

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### isAvailable

Whether this quest is available.

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### isUpgrade

Whether this quest requires membership to accept.

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### hasCompletedBefore

Whether this quest has been completed before.

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### isDaily

Whether this quest is a daily quest.

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### isWeekly

Whether this quest is a weekly quest.

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### isMonthly

Whether this quest is a monthly quest.

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

