<a name="Quests"></a>

## Quests
**Kind**: global class  

* [Quests](#Quests)
    * [new Quests(bot)](#new_Quests_new)
    * [.bot](#Quests+bot) : <code>Bot</code>
    * [.tree](#Quests+tree) ⇒ [<code>Array.&lt;Quest&gt;</code>](#Quest)
    * [.accept(questID)](#Quests+accept) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.load(questID)](#Quests+load) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.complete(questID, [turnIns], [itemID])](#Quests+complete) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.loadMultiple(questIDs)](#Quests+loadMultiple) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.resolve(questID)](#Quests+resolve) ⇒ [<code>Quest</code>](#Quest)

<a name="new_Quests_new"></a>

### new Quests(bot)

| Param | Type |
| --- | --- |
| bot | <code>Bot</code> | 

<a name="Quests+bot"></a>

### quests.bot : <code>Bot</code>
**Kind**: instance property of [<code>Quests</code>](#Quests)  
<a name="Quests+tree"></a>

### quests.tree ⇒ [<code>Array.&lt;Quest&gt;</code>](#Quest)
Gets all quests loaded in the client.

**Kind**: instance property of [<code>Quests</code>](#Quests)  
<a name="Quests+accept"></a>

### quests.accept(questID) ⇒ <code>Promise.&lt;void&gt;</code>
Accepts a quest.

**Kind**: instance method of [<code>Quests</code>](#Quests)  

| Param | Type |
| --- | --- |
| questID | <code>string</code> | 

<a name="Quests+load"></a>

### quests.load(questID) ⇒ <code>Promise.&lt;void&gt;</code>
Loads a quest.

**Kind**: instance method of [<code>Quests</code>](#Quests)  

| Param | Type | Description |
| --- | --- | --- |
| questID | <code>string</code> | The quest id to load. |

<a name="Quests+complete"></a>

### quests.complete(questID, [turnIns], [itemID]) ⇒ <code>Promise.&lt;void&gt;</code>
Completes a quest.

**Kind**: instance method of [<code>Quests</code>](#Quests)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| questID | <code>string</code> |  | The quest id to complete. |
| [turnIns] | <code>number</code> | <code>1</code> | The number of times to turn-in the quest. |
| [itemID] | <code>number</code> | <code>-1</code> | The ID of the quest rewards to select. |

<a name="Quests+loadMultiple"></a>

### quests.loadMultiple(questIDs) ⇒ <code>Promise.&lt;void&gt;</code>
Loads multiple quests at once

**Kind**: instance method of [<code>Quests</code>](#Quests)  

| Param | Type | Description |
| --- | --- | --- |
| questIDs | <code>string</code> \| <code>Array.&lt;string&gt;</code> | Quest IDs deliminated by a comma |

<a name="Quests+resolve"></a>

### quests.resolve(questID) ⇒ [<code>Quest</code>](#Quest)
Resolves a Quest instance from the quest tree

**Kind**: instance method of [<code>Quests</code>](#Quests)  

| Param | Type |
| --- | --- |
| questID | <code>number</code> | 

