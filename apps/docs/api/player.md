<a name="Player"></a>

## Player
Represents the local player.

**Kind**: global class  

* [Player](#Player)
    * [new Player(bot)](#new_Player_new)
    * [.factions](#Player+factions) ⇒ [<code>Array.&lt;Faction&gt;</code>](#Faction)
    * [.className](#Player+className) ⇒ <code>string</code>
    * [.state](#Player+state) ⇒ <code>number</code>
    * [.hp](#Player+hp) ⇒ <code>number</code>
    * [.maxHp](#Player+maxHp) ⇒ <code>number</code>
    * [.alive](#Player+alive) ⇒ <code>boolean</code>
    * [.mp](#Player+mp) ⇒ <code>number</code>
    * [.maxMp](#Player+maxMp) ⇒ <code>number</code>
    * [.level](#Player+level) ⇒ <code>number</code>
    * [.gold](#Player+gold) ⇒ <code>number</code>
    * [.isAfk](#Player+isAfk) ⇒ <code>boolean</code>
    * [.isMember](#Player+isMember) ⇒ <code>boolean</code>
    * [.xPos](#Player+xPos) ⇒ <code>number</code>
    * [.yPos](#Player+yPos) ⇒ <code>number</code>
    * [.cell](#Player+cell) ⇒ <code>string</code>
    * [.pad](#Player+pad) ⇒ <code>string</code>
    * [.walkTo(x, y)](#Player+walkTo) ⇒ <code>void</code>

<a name="new_Player_new"></a>

### new Player(bot)

| Param | Type |
| --- | --- |
| bot | <code>Bot</code> | 

<a name="Player+factions"></a>

### player.factions ⇒ [<code>Array.&lt;Faction&gt;</code>](#Faction)
Get the player's factions data.

**Kind**: instance property of [<code>Player</code>](#Player)  
<a name="Player+className"></a>

### player.className ⇒ <code>string</code>
Gets the name of the player's equipped class.

**Kind**: instance property of [<code>Player</code>](#Player)  
<a name="Player+state"></a>

### player.state ⇒ <code>number</code>
Gets the state of the current player.

**Kind**: instance property of [<code>Player</code>](#Player)  
<a name="Player+hp"></a>

### player.hp ⇒ <code>number</code>
Gets the current health of the current player.

**Kind**: instance property of [<code>Player</code>](#Player)  
<a name="Player+maxHp"></a>

### player.maxHp ⇒ <code>number</code>
Gets the maximum health of the current player.

**Kind**: instance property of [<code>Player</code>](#Player)  
<a name="Player+alive"></a>

### player.alive ⇒ <code>boolean</code>
Checks if the current player is alive.

**Kind**: instance property of [<code>Player</code>](#Player)  
<a name="Player+mp"></a>

### player.mp ⇒ <code>number</code>
Gets the current mana of the current player.

**Kind**: instance property of [<code>Player</code>](#Player)  
<a name="Player+maxMp"></a>

### player.maxMp ⇒ <code>number</code>
Gets the maximum mana of the current player.

**Kind**: instance property of [<code>Player</code>](#Player)  
<a name="Player+level"></a>

### player.level ⇒ <code>number</code>
Gets the level of the current player.

**Kind**: instance property of [<code>Player</code>](#Player)  
<a name="Player+gold"></a>

### player.gold ⇒ <code>number</code>
Gets the gold of the current player.

**Kind**: instance property of [<code>Player</code>](#Player)  
<a name="Player+isAfk"></a>

### player.isAfk ⇒ <code>boolean</code>
Checks if the current player is AFK.

**Kind**: instance property of [<code>Player</code>](#Player)  
<a name="Player+isMember"></a>

### player.isMember ⇒ <code>boolean</code>
Checks if the current player has membership.

**Kind**: instance property of [<code>Player</code>](#Player)  
<a name="Player+xPos"></a>

### player.xPos ⇒ <code>number</code>
The X position of the current player

**Kind**: instance property of [<code>Player</code>](#Player)  
<a name="Player+yPos"></a>

### player.yPos ⇒ <code>number</code>
The Y position of the current player

**Kind**: instance property of [<code>Player</code>](#Player)  
<a name="Player+cell"></a>

### player.cell ⇒ <code>string</code>
Get the cell of the current player in the map.

**Kind**: instance property of [<code>Player</code>](#Player)  
<a name="Player+pad"></a>

### player.pad ⇒ <code>string</code>
Get the pad of the current player in the map.

**Kind**: instance property of [<code>Player</code>](#Player)  
<a name="Player+walkTo"></a>

### player.walkTo(x, y) ⇒ <code>void</code>
Walk to a position in the map.

**Kind**: instance method of [<code>Player</code>](#Player)  

| Param | Type |
| --- | --- |
| x | <code>number</code> | 
| y | <code>number</code> | 

