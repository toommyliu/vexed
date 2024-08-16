---
title: Item
outline: deep
---
# Item

The base for all things item-related.



## Properties

### data
Data about this item

Type: <code><a href="/api/struct/item">ItemData</a></code>

### id<Badge text="getter" />
The ID of the item.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code>

### name<Badge text="getter" />
The name of the item.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>

### description<Badge text="getter" />
The description of the item.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>

### quantity<Badge text="getter" />
The quantity of the item in this stack.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code>

### maxStack<Badge text="getter" />
The maximum stack size this item can exist in.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/number">number</a></code>

### category<Badge text="getter" />
The category of the item.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>

### itemGroup<Badge text="getter" />
The group of the item.
co = Armor, ba = Cape, he = Helm, pe = Pet, Weapon = Weapon

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>

### fileName<Badge text="getter" />
The name of the source file of the item.

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>

### fileLink<Badge text="getter" />
The link to the source file of the item

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>

### meta<Badge text="getter" />
The meta value of the item (used for boosts).

Type: <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/string">string</a></code>

## Methods

### isUpgrade
Indicates if the item is a member/upgrade only item.

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

### isAC
Indicates if the item is an AC item.

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

### isTemp
Whether the item is a temporary item.

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>

### isMaxed
Whether the item is at its maximum stack size.

**Returns:** <code><a href="https://developer.mozilla.org/en-us/docs/web/javascript/reference/global_objects/boolean">boolean</a></code>
