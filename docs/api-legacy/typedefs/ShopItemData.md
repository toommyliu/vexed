# ShopItemData

Represents the data structure for an item.

```typescript
type ShopItemData = ShopItemData
```

## Fields

| Name | Type | Description |
|------|------|-------------|
| `CharID` | `number` |  |
| `CharItemID` | `number` |  |
| `EnhDPS` | `number` |  |
| `EnhID` | `number` |  |
| `EnhLvl` | `number` |  |
| `EnhPatternID` | `number` |  |
| `EnhRng` | `number` |  |
| `EnhRty` | `number` |  |
| `ItemID` | `number` |  |
| `bBank` | `number` |  |
| `bCoins` | `number` |  |
| `bEquip` | `number` |  |
| `bStaff` | `number` |  |
| `bTemp` | `number` |  |
| `bUpg` | `number` |  |
| `dPurchase` | `string` |  |
| `iCost` | `number` |  |
| `iDPS` | `number` |  |
| `iHrs` | `number` |  |
| `iLvl` | `number` |  |
| `iQty` | `number` |  |
| `iRng` | `number` |  |
| `iRty` | `number` |  |
| `iStk` | `number` |  |
| `iType` | `number` |  |
| `sDesc` | `string` |  |
| `sES` | `string` |  |
| `sElmt` | `string` |  |
| `sFile` | `string` |  |
| `sIcon` | `string` |  |
| `sLink` | `string` |  |
| `sMeta` | `string` |  |
| `sName` | `string` |  |
| `sType` | `string` |  |
| `FactionID` | `string` | Faction ID associated with the item. |
| `ShopItemID` | `string` | Shop item id. |
| `bHouse` | `string` | Whether the item can be placed in a house. |
| `iClass` | `string` |  |
| `iQSindex` | `string` |  |
| `iQSvalue` | `string` |  |
| `iQtyRemain` | `string` |  |
| `iReqCP` | `string` |  |
| `iReqRep` | `string` |  |
| `items` | `{ ItemID: string; iQty: string; sName: string; }[]` | Items required to merge this item. |
| `sFaction` | `string` | Faction associated with the item. |
