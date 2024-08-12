# Inventory



## Properties

### items
<p>Gets items in the Inventory of the current player.</p>


Return type: InventoryItem[]

### totalSlots
<p>Gets the total number of slots in the Inventory of the current player.</p>


Return type: number

### usedSlots
<p>Gets the number of used slots in the Inventory of the current player.</p>


Return type: number

### availableSlots
<p>Gets the number of available slots in the Inventory of the current player.</p>


Return type: number

## Methods

### get
Signature: `get(itemKey: string | number)`

Resolves an item from the Inventory.


Return type: InventoryItem

### contains
Signature: `contains(itemKey: string | number, quantity: number)`

Whether the item meets some quantity in this store


Return type: boolean