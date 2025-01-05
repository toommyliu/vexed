---
outline: deep
---

# Shops

---

### Properties

#### bot

Type: `Bot`

#### info

​<Badge type="info">getter</Badge>The info about the current loaded shop.

Type: `ShopInfo \| null`

### Methods

#### isShopLoaded

Whether any shop is loaded.

**Returns:** `boolean`

#### buyByName

Buy an item from the shop.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `itemName` | `string` | The name of the item. |
| `quantity` | `number \| null` | The quantity of the item. If not provided, it will default to 1. |

**Returns:** `Promise<void>`

#### buyById

Buy an item from the shop.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `itemId` | `number` | The id of the item. |
| `quantity` | `number` | he quantity of the item. |

**Returns:** `Promise<void>`

#### resetShopInfo

Reset the loaded shop info.

**Returns:** `void`

#### load

Load a shop.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `shopId` | `string \| number` | The shop ID. |

**Returns:** `Promise<void>`

#### sell

Sells an entire stack of an item.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `itemKey` | `string` | The name or ID of the item. |

**Returns:** `Promise<void>`

#### loadHairShop

Loads a hair shop.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `shopId` | `string \| number` | The shop ID. |

**Returns:** `void`

#### openArmorCustomizer

Opens the Armor Customization menu.

**Returns:** `void`

