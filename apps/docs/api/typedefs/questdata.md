---
outline: deep
---

# QuestData

Type: [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)


## Properties
| Property | Type | Description |
| -------- | ---- | ----------- |
| status | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> |  |
| bUpg | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> |  |
| iReqRep | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The required faction rep to accept this quest. |
| sFaction | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | The name of the faction that this quest is for. |
| bOnce | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | Whether this quest can only be completed once. |
| oItems | <code>Record<string, import('./Item').ItemData></code> | ItemIDs mapped to their data. |
| iSlot | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> |  |
| sEndText | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | The text when this quest can be completed. |
| sName | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | The name of this quest. |
| metaValues | <code>Record<unknown, unknown></code> |  |
| reward | `QuestRewardRaw[]` |  |
| iValue | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> |  |
| iWar | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> |  |
| oRewards | <code>Record<{"itemsR": Record<string, import('./Item').ItemData>}, unknown></code> |  |
| iClass | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The id of the class required to accept this quest. Otherwise, this value is 0. |
| bGuild | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> |  |
| iGold | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The amount of gold rewarded for completing this quest. |
| RequiredItems | `QuestRequiredItemsRaw[]` |  |
| iExp | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The amount of experience rewarded for completing this quest. |
| iReqCP | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The class points required to accept this quest. Otherwise, this value is 0. |
| QuestID | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | The ID of this quest. |
| Rewards | `QuestRewards2Raw[]` |  |
| sDesc | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | The description of this quest. |
| bitSuccess | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> |  |
| iLvl | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | The required level to accept this quest. |
| bStaff | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> |  |
| FactionID | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | The faction required to accept this quest. |
| turnin | `QuestTurnInRaw[]` |  |
| iRep | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The amount of reputation rewarded for completing this quest. Otherwise, this value is 0. |