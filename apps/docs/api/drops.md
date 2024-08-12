# Drops





## Methods

### getItemFromID
Signature: `getItemFromID(itemID: number)`



Return type: ItemData

### getItemFromName
Signature: `getItemFromName(itemName: string)`



Return type: ItemData

### getNameFromID
Signature: `getNameFromID(itemID: number)`



Return type: string

### getIDFromName
Signature: `getIDFromName(itemName: string)`



Return type: number

### getDropCount
Signature: `getDropCount(itemID: number)`

Returns the count of the item in the drop stack. Returns -1 if it hasn't dropped.


Return type: number

### addDrop
Signature: `addDrop(itemData: Record<string, any>)`

Adds an item to the internal store and the stack as visible to the client.


Return type: void