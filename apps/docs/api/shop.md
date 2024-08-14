---
outline: deep
---
# Shop





## Properties

### loaded <Badge text="getter" />
Whether a shop is loaded.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code>

### info <Badge text="getter" />
The info about the current loaded shop.


Return type: <code><a href="/api/typedefs/shopinfo">ShopInfo</a></code>

## Methods

### buyByName
Buy an item from the shop.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| name | string |  |
| quantity | ?number |  |



**Returns:** `Promise<void>` 

### buyByID
Buy an item from the shop using its ID.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemID | number |  |
| shopItemID | number |  |
| quantity | number |  |



**Returns:** `Promise<void>` 

### reset
Reset loaded shop info.



**Returns:** `void` 

### load
Load a shop.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| shopID | number |  |



**Returns:** `Promise<void>` 

### sell
Sells an entire stack of an item.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemName | string |  |



**Returns:** `Promise<void>` 

### loadHairShop
Loads a Hair Shop menu.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| id | number |  |



**Returns:** `void` 

### loadArmorCustomise
Loads the Armor Customization menu.



**Returns:** `void` 