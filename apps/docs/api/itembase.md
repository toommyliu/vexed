<a name="ItemBase"></a>

## ItemBase
**Kind**: global class  

* [ItemBase](#ItemBase)
    * [new ItemBase(data)](#new_ItemBase_new)
    * [.id](#ItemBase+id) ⇒ <code>number</code>
    * [.name](#ItemBase+name) ⇒ <code>string</code>
    * [.description](#ItemBase+description) ⇒ <code>string</code>
    * [.quantity](#ItemBase+quantity) ⇒ <code>number</code>
    * [.maxStack](#ItemBase+maxStack) ⇒ <code>number</code>
    * [.isUpgrade](#ItemBase+isUpgrade) ⇒ <code>boolean</code>
    * [.isAC](#ItemBase+isAC) ⇒ <code>boolean</code>
    * [.category](#ItemBase+category) ⇒ <code>string</code>
    * [.isTemp](#ItemBase+isTemp) ⇒ <code>boolean</code>
    * [.itemGroup](#ItemBase+itemGroup) ⇒ <code>string</code>
    * [.fileName](#ItemBase+fileName) ⇒ <code>string</code>
    * [.fileLink](#ItemBase+fileLink) ⇒ <code>string</code>
    * [.meta](#ItemBase+meta) ⇒ <code>string</code>

<a name="new_ItemBase_new"></a>

### new ItemBase(data)

| Param | Type |
| --- | --- |
| data | [<code>ItemData</code>](#ItemData) | 

<a name="ItemBase+id"></a>

### itemBase.id ⇒ <code>number</code>
The ID of the item.

**Kind**: instance property of [<code>ItemBase</code>](#ItemBase)  
<a name="ItemBase+name"></a>

### itemBase.name ⇒ <code>string</code>
The name of the item.

**Kind**: instance property of [<code>ItemBase</code>](#ItemBase)  
<a name="ItemBase+description"></a>

### itemBase.description ⇒ <code>string</code>
The description of the item.

**Kind**: instance property of [<code>ItemBase</code>](#ItemBase)  
<a name="ItemBase+quantity"></a>

### itemBase.quantity ⇒ <code>number</code>
The quantity of the item in this stack.

**Kind**: instance property of [<code>ItemBase</code>](#ItemBase)  
<a name="ItemBase+maxStack"></a>

### itemBase.maxStack ⇒ <code>number</code>
The maximum stack size this item can exist in.

**Kind**: instance property of [<code>ItemBase</code>](#ItemBase)  
<a name="ItemBase+isUpgrade"></a>

### itemBase.isUpgrade ⇒ <code>boolean</code>
Indicates if the item is a member/upgrade only item.

**Kind**: instance property of [<code>ItemBase</code>](#ItemBase)  
<a name="ItemBase+isAC"></a>

### itemBase.isAC ⇒ <code>boolean</code>
Indicates if the item is an AC item.

**Kind**: instance property of [<code>ItemBase</code>](#ItemBase)  
<a name="ItemBase+category"></a>

### itemBase.category ⇒ <code>string</code>
The category of the item.

**Kind**: instance property of [<code>ItemBase</code>](#ItemBase)  
<a name="ItemBase+isTemp"></a>

### itemBase.isTemp ⇒ <code>boolean</code>
Whether the item is a temporary item.

**Kind**: instance property of [<code>ItemBase</code>](#ItemBase)  
<a name="ItemBase+itemGroup"></a>

### itemBase.itemGroup ⇒ <code>string</code>
The group of the item.
co = Armor, ba = Cape, he = Helm, pe = Pet, Weapon = Weapon

**Kind**: instance property of [<code>ItemBase</code>](#ItemBase)  
<a name="ItemBase+fileName"></a>

### itemBase.fileName ⇒ <code>string</code>
The name of the source file of the item.

**Kind**: instance property of [<code>ItemBase</code>](#ItemBase)  
<a name="ItemBase+fileLink"></a>

### itemBase.fileLink ⇒ <code>string</code>
The link to the source file of the item

**Kind**: instance property of [<code>ItemBase</code>](#ItemBase)  
<a name="ItemBase+meta"></a>

### itemBase.meta ⇒ <code>string</code>
The meta value of the item (used for boosts).

**Kind**: instance property of [<code>ItemBase</code>](#ItemBase)  
