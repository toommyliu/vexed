<a name="Drops"></a>

## Drops
**Kind**: global class  

* [Drops](#Drops)
    * [new Drops(bot)](#new_Drops_new)
    * [.stack](#Drops+stack) : <code>Map.&lt;number, number&gt;</code>
    * [.addToStack(itemData)](#Drops+addToStack) ⇒ <code>void</code>
    * [.removeFromStack(itemID)](#Drops+removeFromStack) ⇒ <code>void</code>
    * [.reset()](#Drops+reset) ⇒ <code>void</code>
    * [.pickup(itemResolvable)](#Drops+pickup) ⇒ <code>Promise.&lt;void&gt;</code>

<a name="new_Drops_new"></a>

### new Drops(bot)

| Param | Type |
| --- | --- |
| bot | <code>Bot</code> | 

<a name="Drops+stack"></a>

### drops.stack : <code>Map.&lt;number, number&gt;</code>
The items dropped and their quantity. Maps item ID to their quantity.

**Kind**: instance property of [<code>Drops</code>](#Drops)  
<a name="Drops+addToStack"></a>

### drops.addToStack(itemData) ⇒ <code>void</code>
Adds an item to the drop stack.

**Kind**: instance method of [<code>Drops</code>](#Drops)  

| Param | Type | Description |
| --- | --- | --- |
| itemData | [<code>ItemData</code>](#ItemData) | The item to add. |

<a name="Drops+removeFromStack"></a>

### drops.removeFromStack(itemID) ⇒ <code>void</code>
Removes an item from the drop stack.

**Kind**: instance method of [<code>Drops</code>](#Drops)  

| Param | Type | Description |
| --- | --- | --- |
| itemID | <code>number</code> | The ID of the item to remove. |

<a name="Drops+reset"></a>

### drops.reset() ⇒ <code>void</code>
Resets the drop stack to a clean state.

**Kind**: instance method of [<code>Drops</code>](#Drops)  
<a name="Drops+pickup"></a>

### drops.pickup(itemResolvable) ⇒ <code>Promise.&lt;void&gt;</code>
Collects an item from the drop stack, effectively removing it from the stack.

**Kind**: instance method of [<code>Drops</code>](#Drops)  

| Param | Type | Description |
| --- | --- | --- |
| itemResolvable | <code>string</code> \| <code>number</code> | The name or ID of the item to collect. |

