---
title: Quests
outline: deep
---
# Quests





## Properties

### tree<Badge text="getter" />
Gets all quests loaded in the client.

Type: <code><a href="/api/struct/quest">Quest</a>[]</code>

### accepted<Badge text="getter" />
Gets all accepted quests.

Type: <code><a href="/api/struct/quest">Quest</a>[]</code>

## Methods

### complete
Completes a quest.
| Parameter | Type | Optional | Default | Description |
---------- | ---- | -------- | ------- | ----------- |
| questID | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> |  |  | The quest id to complete. |
| turnIns | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | ✅ | 1 | The number of times to turn-in the quest. |
| itemID | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | ✅ | -1 | The ID of the quest rewards to select. |

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/promise">Promise</a>&lt;void&gt;</code>

### get
Resolves a Quest instance from the quest tree
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| questKey | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>\|<code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The name or questID to get. |

**Returns:** <code>?<a href="/api/struct/quest">Quest</a></code>
