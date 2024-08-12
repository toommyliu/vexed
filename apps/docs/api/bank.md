---
outline: deep
---
# Bank



## Properties

### items
*Getter*

The list of items in the bank.


Return type: <code><a href="/api/struct/bankitem">BankItem[]</a></code>

### availableSlots
*Getter*

Gets the count of available slots of bankable non-AC items


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### usedSlots
*Getter*

Gets the count of used slots of bankable non-AC items


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### totalSlots
*Getter*

Gets the total slots of bankable non-AC items


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

## Methods

### get
Signature: `get(itemKey: string | number)`

Gets an item from the Bank, items should be loaded beforehand


Return type: <code><a href="/api/struct/bankitem">?BankItem</a></code>

### contains
Signature: `contains(itemKey: string | number, quantity: number)`

Whether the item meets some quantity in this store


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code>

### isOpen
Signature: `isOpen()`

Whether the bank ui is open.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code>