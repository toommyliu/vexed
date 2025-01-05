---
outline: deep
---

# Item

The base class for all-things item related.

---

### Properties

#### data

Type: [ItemData](./typedefs/ItemData.md)

Data about this item

#### id

​<Badge type="info">getter</Badge>The ID of the item.

Type: [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

#### name

​<Badge type="info">getter</Badge>The name of the item.

Type: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

#### description

​<Badge type="info">getter</Badge>The description of the item.

Type: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

#### quantity

​<Badge type="info">getter</Badge>The quantity of the item in this stack.

Type: [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

#### maxStack

​<Badge type="info">getter</Badge>The maximum stack size this item can exist in.

Type: [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)

#### category

​<Badge type="info">getter</Badge>The category of the item.

Type: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

#### itemGroup

​<Badge type="info">getter</Badge>The group of the item.

**Remarks:** co = Armor

ba = Cape

he = Helm

pe = Pet

Weapon = Weapon

Type: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

#### fileName

​<Badge type="info">getter</Badge>The name of the source file of the item.

Type: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

#### fileLink

​<Badge type="info">getter</Badge>The link to the source file of the item

Type: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)

#### meta

​<Badge type="info">getter</Badge>The meta value of the item.

**Remarks:** This is specifically for items with boosts.

Type: [Record](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)<[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String), [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)>

### Methods

#### isUpgrade

Whether the item is member-only.

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### isAC

Whether the item is AC tagged.

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### isTemp

Whether the item belongs to the temp inventory.

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

#### isMaxed

Whether the item is at its maximum stack size.

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

