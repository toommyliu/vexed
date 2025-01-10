---
outline: deep
---

# Bank 

---

### Properties

#### bot

Type: `Bot`

#### items

​<Badge type="info">getter</Badge>The list of items in the bank.

Type: `BankItem[]`

#### totalSlots

​<Badge type="info">getter</Badge>The number of bank slots.

Type: `number`

#### usedSlots

​<Badge type="info">getter</Badge>The number of bank slots currently in use.

Type: `number`

#### availableSlots

​<Badge type="info">getter</Badge>The number of bank slots available.

Type: `number`

### Methods

#### get

Gets an item from the Bank.

**Remarks:** Bank items must have been loaded beforehand to retrieve an item.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `itemKey` | `string \| number` | The name or ID of the item. |

**Returns:** `BankItem | null`

#### contains

Whether an item meets the quantity in the bank.

**Remarks:** If the item is a Class, the quantity is ignored.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `itemKey` | `string \| number` |  |  | The name or ID of the item. |
| `quantity` | `number` | ✓ | `1` | The quantity of the item. |

**Returns:** `boolean`

#### deposit

Puts an item into the bank.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `item` | `string \| number` | The name or ID of the item. |

**Returns:** `Promise<void>`

#### depositMultiple

Puts multiple items into the bank.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `items` | `(string \| number)[]` | The list of items to deposit. |

**Returns:** `Promise<void>`

#### withdraw

Takes an item out of the bank.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `item` | `string \| number` | The name or ID of the item. |

**Returns:** `Promise<void>`

#### withdrawMultiple

Takes multiple items out of the bank.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `items` | `(string \| number)[]` | The list of items to withdraw. |

**Returns:** `Promise<void>`

#### swap

Swaps an item from the bank with an item from the inventory.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `bankItem` | `string \| number` | The name or ID of the item from the Bank. |
| `inventoryItem` | `string \| number` | The name or ID of the item from the Inventory. |

**Returns:** `Promise<void>`

#### swapMultiple

Swaps multiple items between the bank and inventory.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `items` | `[string \| number, string \| number][]` | A list of item pairs to swap. |

**Returns:** `Promise<void>`

#### open

Opens the bank ui, and loads all items if needed.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `force` | `boolean` | ✓ | `false` | Whether to force open the bank ui, regardless of whether it's open. |
| `loadItems` | `boolean` | ✓ | `false` | Whether to load all items in the bank, regardless of whether they've been loaded. |

**Returns:** `Promise<void>`

#### isOpen

Whether the bank ui is open.

**Returns:** `boolean`

