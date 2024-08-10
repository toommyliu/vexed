# Drops

<p>For managing game drops.</p>

## Properties

### stack
<p>The drop stack as shown in game.</p>


Return type: Record<number, number>

## Methods

### getItemFromID(itemID: number)


Return type: ItemData

### getItemFromName(itemName: string)


Return type: ItemData

### getNameFromID(itemID: number)


Return type: string

### getIDFromName(itemName: string)


Return type: number

### getDropCount(itemID: number)
Returns the count of the item in the drop stack. Returns -1 if it hasn't dropped.


Return type: number

### addDrop(: ?import('./struct/Item').ItemData)
Adds an item to the internal store and the stack as visible to the client.


Return type: void