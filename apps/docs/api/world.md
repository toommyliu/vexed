---
outline: deep
---
# World



## Properties

### players
*Getter*

Gets all players in the current map.


Return type: <code><a href="/api/struct/avatar">Avatar[]</a></code>

### monsters
*Getter*

The monsters in the map.


Return type: `MonsterData[]`

### visibleMonsters
*Getter*

Gets all visible monsters in the current cell.


Return type: <code><a href="/api/struct/monster">Monster[]</a></code>

### availableMonsters
*Getter*

Gets all available monsters in the current cell.


Return type: <code><a href="/api/struct/monster">Monster[]</a></code>

### loading
*Getter*

Checks if the map is still loading.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code>

### cells
*Getter*

Gets all cells of the map.


Return type: `string[]`

### cellPads
*Getter*

*Has setter*
Get cell pads.


Return type: `string[]`

### roomID
*Getter*

Gets the internal room ID of the current map.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### roomNumber
*Getter*

Gets the room number of the current map.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number">number</a></code>

### name
*Getter*

Gets the name of the current map.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String">string</a></code>

### LoadShop
Loading a shop.

### LoadEnhShop
Loading an enhancement shop.

### LoadHairShop
Loading a hair shop.

### EquipItem
Equipping an item.

### UnequipItem
Unequipping an item.

### BuyItem
Buying an item.

### SellItem
Selling an item.

### GetMapItem
Getting a map item (i.e. via the getMapItem packet).

### TryQuestComplete
Sending a quest completion packet.

### AcceptQuest
Accepting a quest.

### Rest
Resting.

### Transfer
Joining another map.

## Methods

### isMonsterAvailable
Signature: `isMonsterAvailable(monsterResolvable: string)`

Whether a monster is available.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code>

### reload
Signature: `reload()`

Reloads the map.


Return type: `void`

### goto
Signature: `goto(name: string)`

Goto the specified player.


Return type: `void`

### isActionAvailable
Signature: `isActionAvailable(action: GameAction)`

Whether the game action has cooled down.


Return type: <code><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean">boolean</a></code>

### loadSWF
Signature: `loadSWF(swf: string)`

Loads a particular swf of the map.


Return type: `void`