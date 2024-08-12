# Item

<p>The base for all things item-related.</p>

## Properties

### id
<p>The ID of the item.</p>


Return type: number

### name
<p>The name of the item.</p>


Return type: string

### description
<p>The description of the item.</p>


Return type: string

### quantity
<p>The quantity of the item in this stack.</p>


Return type: number

### maxStack
<p>The maximum stack size this item can exist in.</p>


Return type: number

### category
<p>The category of the item.</p>


Return type: string

### itemGroup
<p>The group of the item.<br />
co = Armor, ba = Cape, he = Helm, pe = Pet, Weapon = Weapon</p>


Return type: string

### fileName
<p>The name of the source file of the item.</p>


Return type: string

### fileLink
<p>The link to the source file of the item</p>


Return type: string

### meta
<p>The meta value of the item (used for boosts).</p>


Return type: string

## Methods

### isUpgrade
Signature: `isUpgrade()`

Indicates if the item is a member/upgrade only item.


Return type: boolean

### isAC
Signature: `isAC()`

Indicates if the item is an AC item.


Return type: boolean

### isTemp
Signature: `isTemp()`

Whether the item is a temporary item.


Return type: boolean