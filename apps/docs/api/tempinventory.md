---
outline: deep
---
# TempInventory



## Properties

### items
*Getter*

Gets items in the Temp Inventory of the current player.


Return type: <code><a href="/api/struct/tempinventoryitem">TempInventoryItem[]</a></code>

## Methods

### get
Signature: `get(itemKey: string | number)`

Resolves an item from the Bank.


Return type: <code><a href="/api/struct/tempinventoryitem">?TempInventoryItem</a></code>

### contains
Signature: `contains(itemKey: string | number, quantity: number)`

Whether the item meets some quantity in this store


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code>