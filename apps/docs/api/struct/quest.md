---
title: Quest
outline: deep
---
# Quest

Represents a quest.



## Properties

### data
Data about this quest.

Type: `QuestData`

### name<Badge text="getter" />
The name of this quest.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>

### id<Badge text="getter" />
The ID of this quest.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code>

### inProgress<Badge text="getter" />
Whether this quest is in progress.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

### completable<Badge text="getter" />
Whether this quest can be completed.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

### available<Badge text="getter" />
Whether this quest is available.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

### once<Badge text="getter" />
Whether this quest can only be completed once.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

### rewards<Badge text="getter" />
The rewards for completing this quest.

Type: `QuestReward[]`

### requirements<Badge text="getter" />
The requirements needed to complete this quest.

Type: `QuestRequiredItem[]`

## Methods

### isUpgrade
Whether this quest requires membership to accept.

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

### hasCompletedBefore
Whether this quest has been completed before.

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>
