<a name="Bank"></a>

## Bank
**Kind**: global class  

* [Bank](#Bank)
    * [new Bank(bot)](#new_Bank_new)
    * [.items](#Bank+items) ⇒ <code>Array.&lt;BankItem&gt;</code>
    * [.availableSlots](#Bank+availableSlots) ⇒ <code>number</code>
    * [.usedSlots](#Bank+usedSlots) ⇒ <code>number</code>
    * [.totalSlots](#Bank+totalSlots) ⇒ <code>number</code>
    * [.resolve(itemResolvable)](#Bank+resolve) ⇒ <code>BankItem</code>
    * [.deposit(itemName)](#Bank+deposit) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.withdraw(itemName)](#Bank+withdraw) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.swap(outItem, inItem)](#Bank+swap) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.open()](#Bank+open) ⇒ <code>Promise.&lt;void&gt;</code>

<a name="new_Bank_new"></a>

### new Bank(bot)

| Param | Type |
| --- | --- |
| bot | <code>Bot</code> | 

<a name="Bank+items"></a>

### bank.items ⇒ <code>Array.&lt;BankItem&gt;</code>
Gets the items in the Bank of the current player. The Bank must have been loaded before.

**Kind**: instance property of [<code>Bank</code>](#Bank)  
<a name="Bank+availableSlots"></a>

### bank.availableSlots ⇒ <code>number</code>
Gets the count of available slots of bankable non-AC items.

**Kind**: instance property of [<code>Bank</code>](#Bank)  
<a name="Bank+usedSlots"></a>

### bank.usedSlots ⇒ <code>number</code>
Gets the count of used slots of bankable non-AC items.

**Kind**: instance property of [<code>Bank</code>](#Bank)  
<a name="Bank+totalSlots"></a>

### bank.totalSlots ⇒ <code>number</code>
Gets the total slots of bankable non-AC items.

**Kind**: instance property of [<code>Bank</code>](#Bank)  
<a name="Bank+resolve"></a>

### bank.resolve(itemResolvable) ⇒ <code>BankItem</code>
Resolves an item from the Bank.

**Kind**: instance method of [<code>Bank</code>](#Bank)  

| Param | Type | Description |
| --- | --- | --- |
| itemResolvable | <code>string</code> \| <code>number</code> | The name or ID of the item. |

<a name="Bank+deposit"></a>

### bank.deposit(itemName) ⇒ <code>Promise.&lt;void&gt;</code>
Puts an item into the Bank.

**Kind**: instance method of [<code>Bank</code>](#Bank)  

| Param | Type | Description |
| --- | --- | --- |
| itemName | <code>string</code> | The name of the item. |

<a name="Bank+withdraw"></a>

### bank.withdraw(itemName) ⇒ <code>Promise.&lt;void&gt;</code>
Takes an item out of the bank.

**Kind**: instance method of [<code>Bank</code>](#Bank)  

| Param | Type | Description |
| --- | --- | --- |
| itemName | <code>string</code> | The name of the item. |

<a name="Bank+swap"></a>

### bank.swap(outItem, inItem) ⇒ <code>Promise.&lt;void&gt;</code>
Swaps an item from the bank with an item from the inventory.

**Kind**: instance method of [<code>Bank</code>](#Bank)  

| Param | Type | Description |
| --- | --- | --- |
| outItem | <code>string</code> | The name of the item in the bank. |
| inItem | <code>string</code> | The name of the item in the inventory. |

<a name="Bank+open"></a>

### bank.open() ⇒ <code>Promise.&lt;void&gt;</code>
Opens the bank.

**Kind**: instance method of [<code>Bank</code>](#Bank)  
