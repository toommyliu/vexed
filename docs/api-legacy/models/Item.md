---
outline: deep
---

# Item 

The base class for all-things item related.

---

### Properties

#### data

Type: `ItemData`

Data about this item

#### id

​<Badge type="info">getter</Badge>The ID of the item.

Type: `number`

#### name

​<Badge type="info">getter</Badge>The name of the item.

Type: `string`

#### description

​<Badge type="info">getter</Badge>The description of the item.

Type: `string`

#### quantity

​<Badge type="info">getter</Badge>The quantity of the item in this stack.

Type: `number`

#### maxStack

​<Badge type="info">getter</Badge>The maximum stack size this item can exist in.

Type: `number`

#### category

​<Badge type="info">getter</Badge>The category of the item.

Type: `string`

#### itemGroup

​<Badge type="info">getter</Badge>The group of the item.

**Remarks:** co = Armor

ba = Cape

he = Helm

pe = Pet

Weapon = Weapon

Type: `string`

#### fileName

​<Badge type="info">getter</Badge>The name of the source file of the item.

Type: `string`

#### fileLink

​<Badge type="info">getter</Badge>The link to the source file of the item

Type: `string`

#### meta

​<Badge type="info">getter</Badge>The meta value of the item.

**Remarks:** This is specifically for items with boosts.

Type: `Record<string, number> | null`

### Methods

#### isUpgrade

Whether the item is member-only.

**Returns:** `boolean`

#### isAC

Whether the item is AC tagged.

**Returns:** `boolean`

#### isTemp

Whether the item belongs to the temp inventory.

**Returns:** `boolean`

#### isArmor

Whether the item is type Armor.

**Returns:** `boolean`

#### isCape

Whether the item is type Cape.

**Returns:** `boolean`

#### isHelm

Whether the item is type Helm.

**Returns:** `boolean`

#### isPet

Whether the item is type Pet.

**Returns:** `boolean`

#### isWeapon

Whether the item is type Weapon.

**Returns:** `boolean`

#### isMaxed

Whether the item is at its maximum stack size.

**Returns:** `boolean`

