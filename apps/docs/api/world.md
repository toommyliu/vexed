<a name="World"></a>

## World
**Kind**: global class  

* [World](#World)
    * [new World(bot)](#new_World_new)
    * [.players](#World+players) ⇒ [<code>Array.&lt;Avatar&gt;</code>](#Avatar)
    * [.visibleMonsters](#World+visibleMonsters) ⇒ [<code>Array.&lt;Monster&gt;</code>](#Monster)
    * [.availableMonsters](#World+availableMonsters) ⇒ [<code>Array.&lt;Monster&gt;</code>](#Monster)
    * [.loading](#World+loading) ⇒ <code>boolean</code>
    * [.cells](#World+cells) ⇒ <code>Array.&lt;string&gt;</code>
    * [.roomId](#World+roomId) ⇒ <code>number</code>
    * [.roomNumber](#World+roomNumber) ⇒ <code>number</code>
    * [.name](#World+name) ⇒ <code>string</code>
    * [.itemTree](#World+itemTree) ⇒ <code>Array.&lt;InventoryItemData&gt;</code>
    * [.isMonsterAvailable(monsterResolvable)](#World+isMonsterAvailable) ⇒ <code>boolean</code>
    * [.reload()](#World+reload) ⇒ <code>void</code>
    * [.setSpawnpoint()](#World+setSpawnpoint) ⇒ <code>void</code>
    * [.jump(cell, [pad], [force])](#World+jump) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.join(mapName, [cell], [pad])](#World+join) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.goto(name)](#World+goto) ⇒ <code>void</code>
    * [.isActionAvailable(action)](#World+isActionAvailable) ⇒ <code>boolean</code>
    * [.getMapItem(itemId)](#World+getMapItem) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.loadSWF(swf)](#World+loadSWF) ⇒ <code>void</code>

<a name="new_World_new"></a>

### new World(bot)

| Param | Type |
| --- | --- |
| bot | <code>Bot</code> | 

<a name="World+players"></a>

### world.players ⇒ [<code>Array.&lt;Avatar&gt;</code>](#Avatar)
Gets all players in the current map.

**Kind**: instance property of [<code>World</code>](#World)  
<a name="World+visibleMonsters"></a>

### world.visibleMonsters ⇒ [<code>Array.&lt;Monster&gt;</code>](#Monster)
Gets all visible monsters in the current cell.

**Kind**: instance property of [<code>World</code>](#World)  
<a name="World+availableMonsters"></a>

### world.availableMonsters ⇒ [<code>Array.&lt;Monster&gt;</code>](#Monster)
Gets all available monsters in the current cell.

**Kind**: instance property of [<code>World</code>](#World)  
<a name="World+loading"></a>

### world.loading ⇒ <code>boolean</code>
Checks if the map is still loading.

**Kind**: instance property of [<code>World</code>](#World)  
<a name="World+cells"></a>

### world.cells ⇒ <code>Array.&lt;string&gt;</code>
Gets all cells of the map.

**Kind**: instance property of [<code>World</code>](#World)  
<a name="World+roomId"></a>

### world.roomId ⇒ <code>number</code>
Gets the internal room ID of the current map.

**Kind**: instance property of [<code>World</code>](#World)  
<a name="World+roomNumber"></a>

### world.roomNumber ⇒ <code>number</code>
Gets the room number of the current map.

**Kind**: instance property of [<code>World</code>](#World)  
<a name="World+name"></a>

### world.name ⇒ <code>string</code>
Gets the name of the current map.

**Kind**: instance property of [<code>World</code>](#World)  
<a name="World+itemTree"></a>

### world.itemTree ⇒ <code>Array.&lt;InventoryItemData&gt;</code>
**Kind**: instance property of [<code>World</code>](#World)  
<a name="World+isMonsterAvailable"></a>

### world.isMonsterAvailable(monsterResolvable) ⇒ <code>boolean</code>
Whether a monster is available.

**Kind**: instance method of [<code>World</code>](#World)  

| Param | Type | Description |
| --- | --- | --- |
| monsterResolvable | <code>string</code> | The name of the monster or in monMapID format. |

<a name="World+reload"></a>

### world.reload() ⇒ <code>void</code>
Reloads the map.

**Kind**: instance method of [<code>World</code>](#World)  
<a name="World+setSpawnpoint"></a>

### world.setSpawnpoint() ⇒ <code>void</code>
Sets the player's spawnpoint to the current cell and pad.

**Kind**: instance method of [<code>World</code>](#World)  
<a name="World+jump"></a>

### world.jump(cell, [pad], [force]) ⇒ <code>Promise.&lt;void&gt;</code>
Jump to the specified cell and pad of the current map.

**Kind**: instance method of [<code>World</code>](#World)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| cell | <code>string</code> |  | The cell to jump to. |
| [pad] | <code>string</code> | <code>&quot;\&quot;Spawn\&quot;&quot;</code> | The pad to jump to. |
| [force] | <code>boolean</code> | <code>false</code> | Whether to allow jumping to the same cell. |

<a name="World+join"></a>

### world.join(mapName, [cell], [pad]) ⇒ <code>Promise.&lt;void&gt;</code>
Joins a map.

**Kind**: instance method of [<code>World</code>](#World)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| mapName | <code>string</code> |  | The name of the map to join. |
| [cell] | <code>string</code> | <code>&quot;\&quot;Enter\&quot;&quot;</code> | The cell to jump to. |
| [pad] | <code>string</code> | <code>&quot;\&quot;Spawn\&quot;&quot;</code> | The pad to jump to. |

<a name="World+goto"></a>

### world.goto(name) ⇒ <code>void</code>
Goto the specified player.

**Kind**: instance method of [<code>World</code>](#World)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | The name of the player to goto. |

<a name="World+isActionAvailable"></a>

### world.isActionAvailable(action) ⇒ <code>boolean</code>
Whether the game action has cooled down.

**Kind**: instance method of [<code>World</code>](#World)  

| Param | Type | Description |
| --- | --- | --- |
| action | [<code>GameAction</code>](#GameAction) | The game action to check. |

<a name="World+getMapItem"></a>

### world.getMapItem(itemId) ⇒ <code>Promise.&lt;void&gt;</code>
Gets a item in the world.

**Kind**: instance method of [<code>World</code>](#World)  

| Param | Type |
| --- | --- |
| itemId | <code>string</code> | 

<a name="World+loadSWF"></a>

### world.loadSWF(swf) ⇒ <code>void</code>
Loads a particular swf of the map.

**Kind**: instance method of [<code>World</code>](#World)  

| Param | Type | Description |
| --- | --- | --- |
| swf | <code>string</code> | The swf to load |

