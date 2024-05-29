<a name="Settings"></a>

## Settings
**Kind**: global class  

* [Settings](#Settings)
    * [new Settings(bot)](#new_Settings_new)
    * [.bot](#Settings+bot) : <code>Bot</code>
    * [.setInfiniteRange()](#Settings+setInfiniteRange) ⇒ <code>void</code>
    * [.setProvokeMonsters()](#Settings+setProvokeMonsters) ⇒ <code>void</code>
    * [.setEnemyMagnet()](#Settings+setEnemyMagnet) ⇒ <code>void</code>
    * [.setLagKiller(on)](#Settings+setLagKiller)
    * [.hidePlayers()](#Settings+hidePlayers) ⇒ <code>void</code>
    * [.skipCutscenes()](#Settings+skipCutscenes) ⇒ <code>void</code>
    * [.setWalkSpeed(walkSpeed)](#Settings+setWalkSpeed)
    * [.setFPS(fps)](#Settings+setFPS) ⇒ <code>void</code>

<a name="new_Settings_new"></a>

### new Settings(bot)

| Param | Type |
| --- | --- |
| bot | <code>Bot</code> | 

<a name="Settings+bot"></a>

### settings.bot : <code>Bot</code>
**Kind**: instance property of [<code>Settings</code>](#Settings)  
<a name="Settings+setInfiniteRange"></a>

### settings.setInfiniteRange() ⇒ <code>void</code>
Allows the current player to attack from any range.

**Kind**: instance method of [<code>Settings</code>](#Settings)  
<a name="Settings+setProvokeMonsters"></a>

### settings.setProvokeMonsters() ⇒ <code>void</code>
Prompts all cell monsters to attack the current player.

**Kind**: instance method of [<code>Settings</code>](#Settings)  
<a name="Settings+setEnemyMagnet"></a>

### settings.setEnemyMagnet() ⇒ <code>void</code>
Sets all cell monsters to sit on the current player.

**Kind**: instance method of [<code>Settings</code>](#Settings)  
<a name="Settings+setLagKiller"></a>

### settings.setLagKiller(on)
Whether to disable drawing of the game.

**Kind**: instance method of [<code>Settings</code>](#Settings)  

| Param | Type |
| --- | --- |
| on | <code>boolean</code> | 

<a name="Settings+hidePlayers"></a>

### settings.hidePlayers() ⇒ <code>void</code>
Hides players in the world.

**Kind**: instance method of [<code>Settings</code>](#Settings)  
<a name="Settings+skipCutscenes"></a>

### settings.skipCutscenes() ⇒ <code>void</code>
Skips cutscenes.

**Kind**: instance method of [<code>Settings</code>](#Settings)  
<a name="Settings+setWalkSpeed"></a>

### settings.setWalkSpeed(walkSpeed)
Sets the current player's walk speed.

**Kind**: instance method of [<code>Settings</code>](#Settings)  

| Param | Type |
| --- | --- |
| walkSpeed | <code>number</code> \| <code>string</code> | 

<a name="Settings+setFPS"></a>

### settings.setFPS(fps) ⇒ <code>void</code>
Sets the client's target fps.

**Kind**: instance method of [<code>Settings</code>](#Settings)  

| Param | Type | Description |
| --- | --- | --- |
| fps | <code>string</code> \| <code>number</code> | The client fps. |

