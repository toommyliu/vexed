# QuestData



```typescript
type QuestData = QuestData
```

## Fields

| Name | Type | Description |
|------|------|-------------|
| `FactionID` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) |  |
| `QuestID` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | The ID of this quest. |
| `RequiredItems` | [QuestRequiredItemsRaw](./typedefs/QuestRequiredItemsRaw.md)[] |  |
| `Rewards` | [QuestRewards2Raw](./typedefs/QuestRewards2Raw.md)[] |  |
| `bGuild` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) |  |
| `bOnce` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | Whether this quest can only be completed once. |
| `bStaff` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) |  |
| `bUpg` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) |  |
| `bitSuccess` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) |  |
| `iClass` | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) |  |
| `iExp` | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The amount of experience rewarded for completing this quest. |
| `iGold` | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The amount of gold rewarded for completing this quest. |
| `iIndex` | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) |  |
| `iLvl` | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The required level to accept this quest. |
| `iRep` | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The amount of reputation rewarded for completing this quest. 0 if not applicable. |
| `iReqCP` | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The class points required to accept this quest. 0 if not applicable. |
| `iReqRep` | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The required faction reputation to accept this quest. |
| `iSlot` | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) |  |
| `iValue` | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) |  |
| `iWar` | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) |  |
| `metaValues` | [Record](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)<[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String), [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)> |  |
| `oItems` | [Record](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)<[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String), [ItemData](./typedefs/ItemData.md)> |  |
| `oRewards` | [Record](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)<[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String), [QuestRewards2Raw](./typedefs/QuestRewards2Raw.md)> |  |
| `reward` | [QuestRewardRaw](./typedefs/QuestRewardRaw.md)[] |  |
| `sDesc` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | The description of this quest. |
| `sEndText` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | The text displayed when this quest can be completed. |
| `sFaction` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | The name of the faction that this quest is for. |
| `sField` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) |  |
| `sName` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | The name of this quest. |
| `status` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | The status of the quest. |
| `turnin` | [QuestTurnInRaw](./typedefs/QuestTurnInRaw.md)[] |  |
