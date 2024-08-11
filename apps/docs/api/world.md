# 



## Properties

### players
<p>Gets all players in the current map.</p>


Return type: Avatar[]

### monsters
<p>The monsters in the map.</p>


Return type: MonsterData[]

### visibleMonsters
<p>Gets all visible monsters in the current cell.</p>


Return type: Monster[]

### availableMonsters
<p>Gets all available monsters in the current cell.</p>


Return type: Monster[]

### loading
<p>Checks if the map is still loading.</p>


Return type: boolean

### cells
<p>Gets all cells of the map.</p>


Return type: string[]

### cellPads
<p>Get cell pads.</p>


Return type: string[]

### roomID
<p>Gets the internal room ID of the current map.</p>


Return type: number

### roomNumber
<p>Gets the room number of the current map.</p>


Return type: number

### name
<p>Gets the name of the current map.</p>


Return type: string

### LoadShop
<p>Loading a shop.</p>

### LoadEnhShop
<p>Loading an enhancement shop.</p>

### LoadHairShop
<p>Loading a hair shop.</p>

### EquipItem
<p>Equipping an item.</p>

### UnequipItem
<p>Unequipping an item.</p>

### BuyItem
<p>Buying an item.</p>

### SellItem
<p>Selling an item.</p>

### GetMapItem
<p>Getting a map item (i.e. via the getMapItem packet).</p>

### TryQuestComplete
<p>Sending a quest completion packet.</p>

### AcceptQuest
<p>Accepting a quest.</p>

### Rest
<p>Resting.</p>

### Transfer
<p>Joining another map.</p>

## Methods

### isMonsterAvailable
Signature: `isMonsterAvailable(monsterResolvable: string)`

Whether a monster is available.


Return type: boolean

### reload
Signature: `reload()`

Reloads the map.


Return type: void

### setSpawnPoint
Signature: `setSpawnPoint()`

Sets the player's spawnpoint to the current cell and pad.


Return type: void

### goto
Signature: `goto(name: string)`

Goto the specified player.


Return type: void

### isActionAvailable
Signature: `isActionAvailable(action: GameAction)`

Whether the game action has cooled down.


Return type: boolean

### loadSWF
Signature: `loadSWF(swf: string)`

Loads a particular swf of the map.


Return type: void