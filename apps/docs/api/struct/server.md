# Server

<p>A game server.</p>

## Properties

### maxPlayers
<p>The maximum number of players</p>


Return type: number

### port
<p>The port number the server is on</p>


Return type: number

### langCode
<p>The language of the server (en/xx/it/pt)</p>


Return type: string

### name
<p>The name of the server</p>


Return type: string

### ip
<p>The IP address of the server</p>


Return type: string

### playerCount
<p>The number of current players</p>


Return type: number

## Methods

### isUpgrade
Signature: `isUpgrade()`

Whether the server is an upgrade-only server


Return type: boolean

### isCanned
Signature: `isCanned()`

The chat-level restriction of the server (0=canned, 2=free)


Return type: boolean