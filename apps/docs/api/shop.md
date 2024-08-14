---
outline: deep
---
# Shop



## Properties

### loaded
*Getter*

Whether a shop is loaded.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code>

### info
*Getter*

The info about the current loaded shop.


Return type: <code><a href="/api/typedefs/shopinfo">ShopInfo</a></code>

## Methods

### buyByName
Signature: `buyByName(name: string, quantity: ?number)`

Buy an item from the shop.


Return type: `Promise<void>`

### buyByID
Signature: `buyByID(itemID: number, shopItemID: number, quantity: number)`

Buy an item from the shop using its ID.


Return type: `Promise<void>`

### reset
Signature: `reset()`

Reset loaded shop info.


Return type: `void`

### load
Signature: `load(shopID: number)`

Load a shop.


Return type: `Promise<void>`

### sell
Signature: `sell(itemName: string)`

Sells an entire stack of an item.


Return type: `Promise<void>`

### loadHairShop
Signature: `loadHairShop(id: number)`

Loads a Hair Shop menu.


Return type: `void`

### loadArmorCustomise
Signature: `loadArmorCustomise()`

Loads the Armor Customization menu.


Return type: `void`