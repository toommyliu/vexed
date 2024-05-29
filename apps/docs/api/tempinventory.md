<a name="TempInventory"></a>

## TempInventory
**Kind**: global class  

* [TempInventory](#TempInventory)
    * [new TempInventory(bot)](#new_TempInventory_new)
    * [.bot](#TempInventory+bot) : <code>Bot</code>
    * [.items](#TempInventory+items) ⇒ <code>Array.&lt;TempInventoryItem&gt;</code>
    * [.resolve(itemResolvable)](#TempInventory+resolve) ⇒ <code>TempInventoryItem</code>

<a name="new_TempInventory_new"></a>

### new TempInventory(bot)

| Param | Type |
| --- | --- |
| bot | <code>Bot</code> | 

<a name="TempInventory+bot"></a>

### tempInventory.bot : <code>Bot</code>
**Kind**: instance property of [<code>TempInventory</code>](#TempInventory)  
<a name="TempInventory+items"></a>

### tempInventory.items ⇒ <code>Array.&lt;TempInventoryItem&gt;</code>
Gets items in the Temp Inventory of the current player.

**Kind**: instance property of [<code>TempInventory</code>](#TempInventory)  
<a name="TempInventory+resolve"></a>

### tempInventory.resolve(itemResolvable) ⇒ <code>TempInventoryItem</code>
Resolves an item from the Bank.

**Kind**: instance method of [<code>TempInventory</code>](#TempInventory)  

| Param | Type | Description |
| --- | --- | --- |
| itemResolvable | <code>string</code> \| <code>number</code> | The name or ID of the item. |

