---
outline: deep
---
# Inventory





## Properties

### items <Badge text="getter" />
Gets items in the Inventory of the current player.


Return type: <code><a href="/api/struct/inventoryitem">InventoryItem[]</a></code>

### totalSlots <Badge text="getter" />
Gets the total number of slots in the Inventory of the current player.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### usedSlots <Badge text="getter" />
Gets the number of used slots in the Inventory of the current player.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### availableSlots <Badge text="getter" />
Gets the number of available slots in the Inventory of the current player.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

## Methods

### get
Resolves an item from the Inventory.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemKey | string \| number |  |



**Returns:** <code><a href="/api/struct/inventoryitem">?InventoryItem</a></code> 

### contains
Whether the item meets some quantity in this store
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemKey | string \| number |  |
| quantity | number |  |



**Returns:** <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code> 

### equip
Equips an item from the Inventory.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemKey | string \| number |  |



**Returns:** `Promise<void>` 