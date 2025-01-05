---
outline: deep
---

# TempInventory

---

### Properties

#### bot

Type: [Bot](.Bot.md)

#### items

​<Badge type="info">getter</Badge>A list of items in the temp inventory.

Type: [TempInventoryItem](.TempInventoryItem.md)[]

### Methods

#### get

Gets an item from the temp inventory.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `itemKey` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The name or ID of the item. |

**Returns:** [TempInventoryItem](.TempInventoryItem.md) | [null](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/null)

#### contains

Whether an item meets the quantity in the temp inventory.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `itemKey` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The name or ID of the item. |
| `quantity` | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The quantity of the item. |

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

