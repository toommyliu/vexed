---
outline: deep
---
# Inventory



## Properties

### items
*Getter*

Gets items in the Inventory of the current player.


Return type: <code><a href="/api/struct/inventoryitem">InventoryItem[]</a></code>

### totalSlots
*Getter*

Gets the total number of slots in the Inventory of the current player.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### usedSlots
*Getter*

Gets the number of used slots in the Inventory of the current player.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### availableSlots
*Getter*

Gets the number of available slots in the Inventory of the current player.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

## Methods

### get
Signature: `get(itemKey: string | number)`

Resolves an item from the Inventory.


Return type: <code><a href="/api/struct/inventoryitem">?InventoryItem</a></code>

### contains
Signature: `contains(itemKey: string | number, quantity: number)`

Whether the item meets some quantity in this store


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code>

### equip
Signature: `equip(itemKey: string | number)`

Equips an item from the Inventory.


Return type: `Promise<void>`