---
outline: deep
---
# Item

The base for all things item-related.



## Properties

### data
Data about this item


Return type: `ItemData`

### id <Badge text="getter" />
The ID of the item.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### name <Badge text="getter" />
The name of the item.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

### description <Badge text="getter" />
The description of the item.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

### quantity <Badge text="getter" />
The quantity of the item in this stack.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### maxStack <Badge text="getter" />
The maximum stack size this item can exist in.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### category <Badge text="getter" />
The category of the item.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

### itemGroup <Badge text="getter" />
The group of the item.
co = Armor, ba = Cape, he = Helm, pe = Pet, Weapon = Weapon


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

### fileName <Badge text="getter" />
The name of the source file of the item.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

### fileLink <Badge text="getter" />
The link to the source file of the item


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

### meta <Badge text="getter" />
The meta value of the item (used for boosts).


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

## Methods

### isUpgrade
Indicates if the item is a member/upgrade only item.



**Returns:** <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code> 

### isAC
Indicates if the item is an AC item.



**Returns:** <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code> 

### isTemp
Whether the item is a temporary item.



**Returns:** <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code> 