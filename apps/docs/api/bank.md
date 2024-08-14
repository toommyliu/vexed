---
outline: deep
---
# Bank





## Properties

### items <Badge text="getter" />
The list of items in the bank.


Return type: <code><a href="/api/struct/bankitem">BankItem[]</a></code>

### availableSlots <Badge text="getter" />
Gets the count of available slots of bankable non-AC items


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### usedSlots <Badge text="getter" />
Gets the count of used slots of bankable non-AC items


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### totalSlots <Badge text="getter" />
Gets the total slots of bankable non-AC items


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

## Methods

### get
Gets an item from the Bank, items should be loaded beforehand
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemKey | string \| number |  |



**Returns:** <code><a href="/api/struct/bankitem">?BankItem</a></code> 

### contains
Whether the item meets some quantity in this store
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemKey | string \| number |  |
| quantity | number |  |



**Returns:** <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code> 

### deposit
Puts an item into the Bank
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemKey | string |  |



**Returns:** `Promise<boolean>` Whether the operation was successful

### swap
Swaps an item from the bank with an item from the inventory.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| bankItem | string |  |
| inventoryItem | string |  |



**Returns:** `Promise<void>` 

### open
Opens the bank ui, and loads all items.



**Returns:** `Promise<void>` 

### isOpen
Whether the bank ui is open.



**Returns:** <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code> 