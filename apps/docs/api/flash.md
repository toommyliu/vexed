<a name="Flash"></a>

## Flash
**Kind**: global class  

* [Flash](#Flash)
    * [new Flash(bot)](#new_Flash_new)
    * [.call(fn, ...args)](#Flash+call) ⇒ <code>any</code> \| <code>null</code>
    * [.get(path, [parse])](#Flash+get) ⇒ <code>any</code> \| <code>null</code>
    * [.getStatic(path, [parse])](#Flash+getStatic) ⇒ <code>any</code> \| <code>null</code>
    * [.set(path, value)](#Flash+set) ⇒ <code>void</code>

<a name="new_Flash_new"></a>

### new Flash(bot)

| Param | Type |
| --- | --- |
| bot | <code>Bot</code> | 

<a name="Flash+call"></a>

### flash.call(fn, ...args) ⇒ <code>any</code> \| <code>null</code>
Calls a game function, whether this be an interop function or an internal function.

**Kind**: instance method of [<code>Flash</code>](#Flash)  

| Param | Type |
| --- | --- |
| fn | <code>string</code> \| <code>function</code> | 
| ...args | <code>any</code> | 

<a name="Flash+get"></a>

### flash.get(path, [parse]) ⇒ <code>any</code> \| <code>null</code>
Gets an actionscript object at the given location.

**Kind**: instance method of [<code>Flash</code>](#Flash)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| path | <code>string</code> |  | The path of the object, relative to Game. |
| [parse] | <code>boolean</code> | <code>false</code> | Whether to call JSON.parse on the return value. |

<a name="Flash+getStatic"></a>

### flash.getStatic(path, [parse]) ⇒ <code>any</code> \| <code>null</code>
Gets an static actionscript object at the given location

**Kind**: instance method of [<code>Flash</code>](#Flash)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| path | <code>string</code> |  | The path of the object, relative to Game. |
| [parse] | <code>boolean</code> | <code>false</code> | Whether to call JSON.parse on the return value. |

<a name="Flash+set"></a>

### flash.set(path, value) ⇒ <code>void</code>
Sets an actionscript object at the given location.

**Kind**: instance method of [<code>Flash</code>](#Flash)  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | The path of the object, relative to Game. |
| value | <code>any</code> | The value to set. |

