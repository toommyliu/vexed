---
outline: deep
---
# Quests



## Properties

### tree
*Getter*

Gets all quests loaded in the client.


Return type: <code><a href="/api/struct/quest">Quest[]</a></code>

### accepted
*Getter*

Gets all accepted quests.


Return type: <code><a href="/api/struct/quest">Quest[]</a></code>

## Methods

### complete
Signature: `complete(questID: string, turnIns?: number = 1, itemID?: number = -1)`

Completes a quest.


Return type: `Promise<void>`

### get
Signature: `get(questKey: string | number)`

Resolves a Quest instance from the quest tree


Return type: <code><a href="/api/struct/quest">?Quest</a></code>