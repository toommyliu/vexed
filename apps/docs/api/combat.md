<a name="Combat"></a>

## Combat
**Kind**: global class  

* [Combat](#Combat)
    * [new Combat(bot)](#new_Combat_new)
    * [.skillSet](#Combat+skillSet) : <code>Array.&lt;number&gt;</code>
    * [.skillDelay](#Combat+skillDelay) : <code>number</code>
    * [.hasTarget](#Combat+hasTarget) ⇒ <code>boolean</code>
    * [.attack(monsterResolvable)](#Combat+attack) ⇒ <code>void</code>
    * [.useSkill(skillIndex, [force], [wait])](#Combat+useSkill)
    * [.rest()](#Combat+rest) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.kill(name)](#Combat+kill) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.killForItem(name, itemResolvable, itemQuantity, [isTemp])](#Combat+killForItem) ⇒ <code>Promise.&lt;void&gt;</code>

<a name="new_Combat_new"></a>

### new Combat(bot)

| Param | Type |
| --- | --- |
| bot | <code>Bot</code> | 

<a name="Combat+skillSet"></a>

### combat.skillSet : <code>Array.&lt;number&gt;</code>
The skills to cycle through.

**Kind**: instance property of [<code>Combat</code>](#Combat)  
<a name="Combat+skillDelay"></a>

### combat.skillDelay : <code>number</code>
The delay between skills.

**Kind**: instance property of [<code>Combat</code>](#Combat)  
<a name="Combat+hasTarget"></a>

### combat.hasTarget ⇒ <code>boolean</code>
Whether the current player has a target.

**Kind**: instance property of [<code>Combat</code>](#Combat)  
<a name="Combat+attack"></a>

### combat.attack(monsterResolvable) ⇒ <code>void</code>
Attacks a monster.

**Kind**: instance method of [<code>Combat</code>](#Combat)  

| Param | Type | Description |
| --- | --- | --- |
| monsterResolvable | <code>string</code> | The name or monMapID of the monster. |

<a name="Combat+useSkill"></a>

### combat.useSkill(skillIndex, [force], [wait])
Uses a skill.

**Kind**: instance method of [<code>Combat</code>](#Combat)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| skillIndex | <code>number</code> \| <code>string</code> |  | The index of the skill; indexes ranges from 1 to 4. |
| [force] | <code>boolean</code> | <code>false</code> | Whether to force the skill to be used (e.g on a random target). |
| [wait] | <code>boolean</code> | <code>false</code> | Whether to wait for the skill to be available |

<a name="Combat+rest"></a>

### combat.rest() ⇒ <code>Promise.&lt;void&gt;</code>
Rests the current player.

**Kind**: instance method of [<code>Combat</code>](#Combat)  
<a name="Combat+kill"></a>

### combat.kill(name) ⇒ <code>Promise.&lt;void&gt;</code>
Kills a monster.

**Kind**: instance method of [<code>Combat</code>](#Combat)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> \| <code>number</code> | The name or monMapID of the monster. |

<a name="Combat+killForItem"></a>

### combat.killForItem(name, itemResolvable, itemQuantity, [isTemp]) ⇒ <code>Promise.&lt;void&gt;</code>
Kills a monster for a specific item.

**Kind**: instance method of [<code>Combat</code>](#Combat)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | <code>string</code> \| <code>number</code> |  | The name or monMapID of the monster. |
| itemResolvable | <code>string</code> \| <code>number</code> |  | The name or ID of the item. |
| itemQuantity | <code>number</code> |  | The quantity of the item. |
| [isTemp] | <code>boolean</code> | <code>false</code> | Whether the item is temporary. |

