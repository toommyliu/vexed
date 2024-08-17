---
title: Bank
outline: deep
---
# Bank





## Properties

### items<Badge text="getter" />
The list of items in the bank.

Type: <code><a href="/api/struct/bankitem">BankItem</a>[]</code>

### availableSlots<Badge text="getter" />
Gets the count of available slots of bankable non-AC items.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code>

### usedSlots<Badge text="getter" />
Gets the count of used slots of bankable non-AC items.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code>

### totalSlots<Badge text="getter" />
Gets the total slots of bankable non-AC items.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code>

## Methods

### get
Gets an item from the Bank, items should be loaded beforehand.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemKey | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>\|<code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The name or ID of the item. |

**Returns:** <code>?<a href="/api/struct/bankitem">BankItem</a></code>

### contains
Whether the item meets some quantity in this store.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemKey | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>\|<code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The name or ID of the item. |
| quantity | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code> | The quantity of the item. |

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

### deposit
Puts an item into the Bank.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemKey | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | The name or ID of the item. |

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/promise">Promise</a>&lt;boolean&gt;</code>

Whether the operation was successful.

### withdraw
Takes an item out of the bank.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| itemKey | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | The name or ID of the item. |

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/promise">Promise</a>&lt;boolean&gt;</code>

Whether the operation was successful.

### swap
Swaps an item from the bank with an item from the inventory.
| Parameter | Type | Description |
| --------- | ---- | ----------- |
| bankItem | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | The name or ID of the item from the Bank. |
| inventoryItem | <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code> | The name or ID of the item from the Inventory. |

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/promise">Promise</a>&lt;void&gt;</code>

Whether the operation was successful.

### open
Opens the bank ui, and loads all items.

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/promise">Promise</a>&lt;void&gt;</code>

### isOpen
Whether the bank ui is open.

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>
