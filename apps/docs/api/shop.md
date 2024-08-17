---
title: Shop
outline: deep
---
# Shop





## Properties

### loaded<Badge text="getter" />
Whether a shop is loaded.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

### info<Badge text="getter" />
The info about the current loaded shop.

Type: <code><a href="/api/typedefs/shopinfo">ShopInfo</a></code>

### exports


## Methods

### buyByName
Buy an item from the shop.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| name | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | The name of the item. |
| quantity | <code>?<a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The quantity of the item. |

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/promise">Promise</a>&lt;void&gt;</code>

### buyByID
Buy an item from the shop using its ID.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemID | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The ID of the item. |
| shopItemID | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The ID of the item corresponding to the shopID. |
| quantity | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The quantity of the item. |

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/promise">Promise</a>&lt;void&gt;</code>

### reset
Reset loaded shop info.

**Returns:** `void`

### load
Load a shop.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| shopID | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> |  |

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/promise">Promise</a>&lt;void&gt;</code>

### sell
Sells an entire stack of an item.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemName | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> |  |

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/promise">Promise</a>&lt;void&gt;</code>

### loadHairShop
Loads a Hair Shop menu.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| id | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> |  |

**Returns:** `void`

### loadArmorCustomise
Loads the Armor Customization menu.

**Returns:** `void`
