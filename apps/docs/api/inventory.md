---
outline: deep
---

# Inventory

---

### Properties

#### bot

Type: [Bot](.Bot.md)

#### items

​<Badge type="info">getter</Badge>Gets items in the Inventory of the current player.

Type: [InventoryItem](.InventoryItem.md)[]

#### totalSlots

​<Badge type="info">getter</Badge>The total slots available in the player's inventory.

Type: [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

#### usedSlots

​<Badge type="info">getter</Badge>The number of used slots in the player's inventory.

Type: [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

#### availableSlots

​<Badge type="info">getter</Badge>The number of available slots in the player's inventory.

Type: [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

### Methods

#### get

Resolves for an Item in the Inventory.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `item` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The name or ID of the item. |

**Returns:** [InventoryItem](.InventoryItem.md) | [null](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/null)

#### contains

Whether an item meets the quantity in the inventory.

**Remarks:** If the item is a Class, the quantity is ignored.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `itemKey` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) |  |  | The name or ID of the item. |
| `quantity` | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | ✓ | `1` | The quantity of the item. |

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### equip

Equips an item from the inventory.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `itemKey` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The name or ID of the item. |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

