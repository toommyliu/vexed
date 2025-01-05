---
outline: deep
---

# Bank

---

### Properties

#### bot

Type: [Bot](.Bot.md)

#### items

​<Badge type="info">getter</Badge>The list of items in the bank.

Type: [BankItem](.BankItem.md)[]

#### totalSlots

​<Badge type="info">getter</Badge>The number of bank slots.

Type: [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

#### usedSlots

​<Badge type="info">getter</Badge>The number of bank slots currently in use.

Type: [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

#### availableSlots

​<Badge type="info">getter</Badge>The number of bank slots available.

Type: [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

### Methods

#### get

Gets an item from the Bank.

**Remarks:** Bank items must have been loaded beforehand to retrieve an item.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `itemKey` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The name or ID of the item. |

**Returns:** [BankItem](.BankItem.md) | [null](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/null)

#### contains

Whether an item meets the quantity in the bank.

**Remarks:** If the item is a Class, the quantity is ignored.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `itemKey` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) |  |  | The name or ID of the item. |
| `quantity` | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | ✓ | `1` | The quantity of the item. |

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### deposit

Puts an item into the bank.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `item` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The name or ID of the item. |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

#### depositMultiple

Puts multiple items into the bank.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `items` | [(string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)[] | The list of items to deposit. |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

#### withdraw

Takes an item out of the bank.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `item` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The name or ID of the item. |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

#### withdrawMultiple

Takes multiple items out of the bank.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `items` | [(string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)[] | The list of items to withdraw. |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

#### swap

Swaps an item from the bank with an item from the inventory.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `bankItem` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The name or ID of the item from the Bank. |
| `inventoryItem` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The name or ID of the item from the Inventory. |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

#### swapMultiple

Swaps multiple items between the bank and inventory.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `items` | [[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| number, string \| [number]](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)[] | A list of item pairs to swap. |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

#### open

Opens the bank ui, and loads all items if needed.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `force` | [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | ✓ | `false` | Whether to force open the bank ui, regardless of whether it's open. |
| `loadItems` | [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | ✓ | `false` | Whether to load all items in the bank, regardless of whether they've been loaded. |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

#### isOpen

Whether the bank ui is open.

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

