# import('./Bot')



## Properties

### items
<p>The list of items in the bank.</p>


Return type: BankItem[]

### availableSlots
<p>Gets the count of available slots of bankable non-AC items</p>


Return type: number

### usedSlots
<p>Gets the count of used slots of bankable non-AC items</p>


Return type: number

### totalSlots
<p>Gets the total slots of bankable non-AC items</p>


Return type: number

## Methods

### get
Signature: `get(itemKey: string | number)`

Gets an item from the Bank, items should be loaded beforehand


Return type: BankItem|null

### contains
Signature: `contains(itemKey: string | number, quantity: number)`

Whether the item meets some quantity in this store


Return type: boolean

### isOpen
Signature: `isOpen()`

Whether the bank ui is open.


Return type: boolean