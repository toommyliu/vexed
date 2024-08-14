---
outline: deep
---
# TempInventory





## Properties

### items <Badge text="getter" />
Gets items in the Temp Inventory of the current player.


Return type: <code><a href="/api/struct/tempinventoryitem">TempInventoryItem[]</a></code>

## Methods

### get
Resolves an item from the Bank.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemKey | string \| number |  |



**Returns:** <code><a href="/api/struct/tempinventoryitem">?TempInventoryItem</a></code> 

### contains
Whether the item meets some quantity in this store
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemKey | string \| number |  |
| quantity | number |  |



**Returns:** <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code> 