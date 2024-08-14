---
outline: deep
---
# Quests





## Properties

### tree <Badge text="getter" />
Gets all quests loaded in the client.


Return type: <code><a href="/api/struct/quest">Quest[]</a></code>

### accepted <Badge text="getter" />
Gets all accepted quests.


Return type: <code><a href="/api/struct/quest">Quest[]</a></code>

## Methods

### complete
Completes a quest.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| questID | string |  |
| turnIns | number |  |
| itemID | number |  |



**Returns:** `Promise<void>` 

### get
Resolves a Quest instance from the quest tree
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| questKey | string \| number |  |



**Returns:** <code><a href="/api/struct/quest">?Quest</a></code> 