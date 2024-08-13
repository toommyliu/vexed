---
outline: deep
---
# Item

The base for all things item-related.

## Properties

### data
Data about this item


Return type: `ItemData`

### id
*Getter*

The ID of the item.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### name
*Getter*

The name of the item.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

### description
*Getter*

The description of the item.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

### quantity
*Getter*

The quantity of the item in this stack.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### maxStack
*Getter*

The maximum stack size this item can exist in.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### category
*Getter*

The category of the item.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

### itemGroup
*Getter*

The group of the item.
co = Armor, ba = Cape, he = Helm, pe = Pet, Weapon = Weapon


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

### fileName
*Getter*

The name of the source file of the item.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

### fileLink
*Getter*

The link to the source file of the item


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

### meta
*Getter*

The meta value of the item (used for boosts).


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

## Methods

### isUpgrade
Signature: `isUpgrade()`

Indicates if the item is a member/upgrade only item.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code>

### isAC
Signature: `isAC()`

Indicates if the item is an AC item.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code>

### isTemp
Signature: `isTemp()`

Whether the item is a temporary item.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code>