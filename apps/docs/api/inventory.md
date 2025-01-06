---
outline: deep
---

# Inventory

---

### Properties

#### bot

Type: `Bot`

#### items

​<Badge type="info">getter</Badge>Gets items in the Inventory of the current player.

Type: `InventoryItem[]`

#### totalSlots

​<Badge type="info">getter</Badge>The total slots available in the player's inventory.

Type: `number`

#### usedSlots

​<Badge type="info">getter</Badge>The number of used slots in the player's inventory.

Type: `number`

#### availableSlots

​<Badge type="info">getter</Badge>The number of available slots in the player's inventory.

Type: `number`

### Methods

#### get

Resolves for an Item in the Inventory.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `item` | `string \| number` | The name or ID of the item. |

**Returns:** `InventoryItem | null`

#### contains

Whether an item meets the quantity in the inventory.

**Remarks:** If the item is a Class, the quantity is ignored.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `itemKey` | `string \| number` |  |  | The name or ID of the item. |
| `quantity` | `number` | ✓ | `1` | The quantity of the item. |

**Returns:** `boolean`

#### equip

Equips an item from the inventory.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `itemKey` | `string \| number` | The name or ID of the item. |

**Returns:** `Promise<void>`

