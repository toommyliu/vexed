---
outline: deep
---

# TempInventory 

---

### Properties

#### bot

Type: `Bot`

#### items

​<Badge type="info">getter</Badge>A list of items in the temp inventory.

Type: `TempInventoryItem[]`

### Methods

#### get

Gets an item from the temp inventory.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `itemKey` | `string \| number` | The name or ID of the item. |

**Returns:** `TempInventoryItem | null`

#### contains

Whether an item meets the quantity in the temp inventory.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `itemKey` | `string \| number` |  |  | The name or ID of the item. |
| `quantity` | `number` | ✓ | `1` | The quantity of the item. |

**Returns:** `boolean`

