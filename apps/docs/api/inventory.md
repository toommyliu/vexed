<a name="Inventory"></a>

## Inventory
**Kind**: global class  

* [Inventory](#Inventory)
    * [new Inventory(bot)](#new_Inventory_new)
    * [.bot](#Inventory+bot) : <code>Bot</code>
    * [.items](#Inventory+items) ⇒ <code>Array.&lt;InventoryItem&gt;</code>
    * [.totalSlots](#Inventory+totalSlots) ⇒ <code>number</code>
    * [.usedSlots](#Inventory+usedSlots) ⇒ <code>number</code>
    * [.availableSlots](#Inventory+availableSlots) ⇒ <code>number</code>
    * [.resolve(itemResolvable)](#Inventory+resolve) ⇒ <code>InventoryItem</code>
    * [.equip(itemResolvable)](#Inventory+equip) ⇒ <code>Promise.&lt;void&gt;</code>

<a name="new_Inventory_new"></a>

### new Inventory(bot)

| Param | Type |
| --- | --- |
| bot | <code>Bot</code> | 

<a name="Inventory+bot"></a>

### inventory.bot : <code>Bot</code>
**Kind**: instance property of [<code>Inventory</code>](#Inventory)  
<a name="Inventory+items"></a>

### inventory.items ⇒ <code>Array.&lt;InventoryItem&gt;</code>
Gets items in the Inventory of the current player.

**Kind**: instance property of [<code>Inventory</code>](#Inventory)  
<a name="Inventory+totalSlots"></a>

### inventory.totalSlots ⇒ <code>number</code>
Gets the total number of slots in the Inventory of the current player.

**Kind**: instance property of [<code>Inventory</code>](#Inventory)  
<a name="Inventory+usedSlots"></a>

### inventory.usedSlots ⇒ <code>number</code>
Gets the number of used slots in the Inventory of the current player.

**Kind**: instance property of [<code>Inventory</code>](#Inventory)  
<a name="Inventory+availableSlots"></a>

### inventory.availableSlots ⇒ <code>number</code>
Gets the number of available slots in the Inventory of the current player.

**Kind**: instance property of [<code>Inventory</code>](#Inventory)  
<a name="Inventory+resolve"></a>

### inventory.resolve(itemResolvable) ⇒ <code>InventoryItem</code>
Resolves an item from the Inventory.

**Kind**: instance method of [<code>Inventory</code>](#Inventory)  

| Param | Type | Description |
| --- | --- | --- |
| itemResolvable | <code>string</code> \| <code>number</code> | The name or ID of the item. |

<a name="Inventory+equip"></a>

### inventory.equip(itemResolvable) ⇒ <code>Promise.&lt;void&gt;</code>
Equips an item from the Inventory.

**Kind**: instance method of [<code>Inventory</code>](#Inventory)  

| Param | Type | Description |
| --- | --- | --- |
| itemResolvable | <code>string</code> \| <code>number</code> | The name or ID of the item. |

