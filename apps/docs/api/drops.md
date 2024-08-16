---
title: Drops
outline: deep
---
# Drops





## Properties

### stack<Badge text="getter" />
The drop stack as shown to the client. The mapping is of the form `itemID -> count`.

Type: <code>Record<number, number></code>

## Methods

### getItemFromID
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemID | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The ID of the item. |

**Returns:** <code>?<a href="/api/struct/item">import('./struct/Item').ItemData</a></code>

The item data, if the item has previously dropped.

### getItemFromName
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemName | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | The name of the item. |

**Returns:** <code>?<a href="/api/struct/item">import('./struct/Item').ItemData</a></code>

The item data, if the item has previously dropped.

### getNameFromID
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemID | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The ID of the item. |

**Returns:** <code>?<a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>

The name of the item, if the item has previously dropped.

### getIDFromName
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemName | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | The name of the item. |

**Returns:** <code>?<a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code>

The ID of the item, if the item has previously dropped.

### getDropCount
Returns the count of the item in the drop stack. Returns -1 if it hasn't dropped.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemID | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The ID of the item. |

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code>

The count of the item in the stack.

### pickup
Accepts the drop for an item in the stack.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemKey | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>\|<code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The item name or ID. |

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/promise">Promise</a>&lt;void&gt;</code>

Whether the operation was successful.

### reject
Rejects the drop, effectively removing from the stack. Items can still be picked up with a getDrop packet.
| Parameter | Type | Optional | Description |
| --------- | ---- | -------- | ----------- |
| itemKey | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>\|<code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> |  | The name or ID of the item. |
| removeFromStore | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code> | ✅ | Whether to delete the item entry from the store. |

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/promise">Promise</a>&lt;void&gt;</code>
