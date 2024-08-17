---
title: TempInventory
outline: deep
---
# TempInventory





## Properties

### items<Badge text="getter" />
Gets items in the Temp Inventory of the current player.

Type: <code><a href="/api/struct/tempinventoryitem">TempInventoryItem</a>[]</code>

## Methods

### get
Resolves an item from the Bank.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemKey | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>\|<code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The name or ID of the item. |

**Returns:** <code>?<a href="/api/struct/tempinventoryitem">TempInventoryItem</a></code>

### contains
Whether the item meets some quantity in this store
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemKey | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>\|<code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The name or ID of the item |
| quantity | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The quantity of the item |

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>
