---
outline: deep
---
# Drops







## Methods

### getItemFromID
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemID | number |  |



**Returns:** `?import('./struct/Item').ItemData` 

### getItemFromName
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemName | string |  |



**Returns:** `?import('./struct/Item').ItemData` 

### getNameFromID
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemID | number |  |



**Returns:** `?string` 

### getIDFromName
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemName | string |  |



**Returns:** `?number` 

### getDropCount
Returns the count of the item in the drop stack. Returns -1 if it hasn't dropped.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemID | number |  |



**Returns:** <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code> 

### addDrop
Adds an item to the internal store and the stack as visible to the client.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemData | Record<string, any> |  |



**Returns:** `void` 

### pickup
Accepts the drop for an item in the stack
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemKey | string \| number |  |



**Returns:** `Promise<void>` 

### reject
Rejects the drop, effectively removing from the stack. Items can technically be picked up after the fact
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemKey | string \| number |  |
| removeFromStore | boolean |  |



**Returns:** `Promise<void>` 