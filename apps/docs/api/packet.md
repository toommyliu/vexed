<a name="Packet"></a>

## Packet
**Kind**: global class  

* [Packet](#Packet)
    * [new Packet(bot)](#new_Packet_new)
    * [.bot](#Packet+bot) : <code>Bot</code>
    * [.sendClient(packet, [type])](#Packet+sendClient) ⇒ <code>void</code>
    * [.sendServer(packet, [type])](#Packet+sendServer) ⇒ <code>void</code>

<a name="new_Packet_new"></a>

### new Packet(bot)

| Param | Type |
| --- | --- |
| bot | <code>Bot</code> | 

<a name="Packet+bot"></a>

### packet.bot : <code>Bot</code>
**Kind**: instance property of [<code>Packet</code>](#Packet)  
<a name="Packet+sendClient"></a>

### packet.sendClient(packet, [type]) ⇒ <code>void</code>
Sends the specified packet to the client (simulates a response as if the server sent the packet).

**Kind**: instance method of [<code>Packet</code>](#Packet)  

| Param | Type | Default |
| --- | --- | --- |
| packet | <code>string</code> |  | 
| [type] | <code>&quot;str&quot;</code> \| <code>&quot;json&quot;</code> \| <code>&quot;xml&quot;</code> | <code>&quot;str&quot;</code> | 

<a name="Packet+sendServer"></a>

### packet.sendServer(packet, [type]) ⇒ <code>void</code>
Sends the specified packet to the server.

**Kind**: instance method of [<code>Packet</code>](#Packet)  

| Param | Type | Default |
| --- | --- | --- |
| packet | <code>string</code> |  | 
| [type] | <code>&quot;String&quot;</code> \| <code>&quot;Json&quot;</code> | <code>&quot;String&quot;</code> | 

