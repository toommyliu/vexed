---
outline: deep
---

# Drops

---

### Properties

#### bot

Type: `Bot`

#### stack

​<Badge type="info">getter</Badge>The drop stack as shown to the client. The mapping is of the form `itemID -> count`.

Type: `Record<number, number>`

### Methods

#### getItemFromId

Retrieves item data using it's ID.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `itemId` | `number` | The ID of the item. |

**Returns:** `ItemData | null`

#### getItemFromName

Retrieves item data using it's name (case-insensitive).

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `itemName` | `string` | The name of the item. |

**Returns:** `ItemData | null`

#### getItemName

Retrieves the name of an item using it's ID.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `itemId` | `number` | The ID of the item. |

**Returns:** `string | null`

#### getItemId

Retrieves the ID of an item using it's name.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `itemName` | `string` | The name of the item. |

**Returns:** `number | null`

#### getDropCount

Retrieves the count of an item in the drop stack.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `itemId` | `number` | The ID of the item. |

**Returns:** `number`

#### addDrop

Adds an item to the internal store and the stack as visible to the client.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `item` | `ItemData` | The item that was dropped. |

**Returns:** `void`

#### pickup

Accepts the drop for an item in the stack.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `itemKey` | `string \| number` | The name or ID of the item. |

**Returns:** `Promise<void>`

#### reject

Rejects a drop from the stack.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `itemKey` | `string \| number` |  |  | The name or ID of the item. |
| `removeFromStore` | `boolean` | ✓ | `false` | Whether to delete the item entry from the store. |

**Returns:** `Promise<void>`

#### hasDrop

Checks if an item exists in the drop stack.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `itemKey` | `string \| number` | The name or ID of the item. |

**Returns:** `boolean`

