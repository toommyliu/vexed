---
outline: deep
---

# Shops

---

### Properties

#### bot

Type: [Bot](.Bot.md)

#### info

​<Badge type="info">getter</Badge>The info about the current loaded shop.

Type: [ShopInfo](./typedefs/ShopInfo.md) | [null](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/null)

### Methods

#### isShopLoaded

Whether any shop is loaded.

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### buyByName

Buy an item from the shop.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `itemName` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | The name of the item. |
| `quantity` | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) \| [null](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/null) | The quantity of the item. If not provided, it will default to 1. |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

#### buyById

Buy an item from the shop.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `itemId` | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The id of the item. |
| `quantity` | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | he quantity of the item. |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

#### resetShopInfo

Reset the loaded shop info.

**Returns:** [void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)

#### load

Load a shop.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `shopId` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The shop ID. |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

#### sell

Sells an entire stack of an item.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `itemKey` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | The name or ID of the item. |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

#### loadHairShop

Loads a hair shop.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `shopId` | [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The shop ID. |

**Returns:** [void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)

#### openArmorCustomizer

Opens the Armor Customization menu.

**Returns:** [void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)

