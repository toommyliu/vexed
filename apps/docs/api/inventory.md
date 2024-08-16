---
title: Inventory
outline: deep
---
# Inventory





## Properties

### items<Badge text="getter" />
Gets items in the Inventory of the current player.

Type: <code><a href="/api/struct/inventoryitem">InventoryItem</a>[]</code>

### totalSlots<Badge text="getter" />
Gets the total number of slots in the Inventory of the current player.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code>

### usedSlots<Badge text="getter" />
Gets the number of used slots in the Inventory of the current player.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code>

### availableSlots<Badge text="getter" />
Gets the number of available slots in the Inventory of the current player.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code>

## Methods

### get
Resolves an item from the Inventory.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemKey | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>\|<code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The name or ID of the item. |

**Returns:** <code>?<a href="/api/struct/inventoryitem">InventoryItem</a></code>

### contains
Whether the item meets some quantity in this store.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemKey | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>\|<code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The name or ID of the item. |
| quantity | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The quantity of the item. |

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

### equip
Equips an item from the Inventory.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemKey | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>\|<code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The name or ID of the item. |

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/promise">Promise</a>&lt;void&gt;</code>
