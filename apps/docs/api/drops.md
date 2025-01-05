---
outline: deep
---

# Drops

---

### Properties

#### bot

Type: [Bot](.Bot.md)

#### stack

​<Badge type="info">getter</Badge>The drop stack as shown to the client. The mapping is of the form `itemID -> count`.

Type: [Record](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)<[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number), [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)>

### Methods

#### getItemFromId

Retrieves item data using it's ID.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `itemId` | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The ID of the item. |

**Returns:** [ItemData](./typedefs/ItemData.md) | [null](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/null)

#### getItemFromName

Retrieves item data using it's name (case-insensitive).

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `itemName` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | The name of the item. |

**Returns:** [ItemData](./typedefs/ItemData.md) | [null](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/null)

#### getItemName

Retrieves the name of an item using it's ID.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `itemId` | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The ID of the item. |

**Returns:** [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | [null](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/null)

#### getItemId

Retrieves the ID of an item using it's name.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `itemName` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | The name of the item. |

**Returns:** [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | [null](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/null)

#### getDropCount

Retrieves the count of an item in the drop stack.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `itemId` | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The ID of the item. |

**Returns:** [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

#### addDrop

Adds an item to the internal store and the stack as visible to the client.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `item` | [ItemData](./typedefs/ItemData.md) | The item that was dropped. |

**Returns:** [void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)

#### pickup

Accepts the drop for an item in the stack.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `itemKey` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The name or ID of the item. |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

#### reject

Rejects a drop from the stack.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `itemKey` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) |  |  | The name or ID of the item. |
| `removeFromStore` | [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | ✓ | `false` | Whether to delete the item entry from the store. |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

#### hasDrop

Checks if an item exists in the drop stack.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `itemKey` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The name or ID of the item. |

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

