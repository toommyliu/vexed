# import('./Bot')



## Properties

### factions
<p>Get the player's factions data.</p>


Return type: Faction[]

### className
<p>Gets the name of the player's equipped class.</p>


Return type: string

### state
<p>Gets the state of the current player.</p>


Return type: PlayerState

### hp
<p>Gets the current health of the current player.</p>


Return type: number

### maxHP
<p>Gets the maximum health of the current player.</p>


Return type: number

### alive
<p>Checks if the current player is alive.</p>


Return type: boolean

### mp
<p>Gets the current mana of the current player.</p>


Return type: number

### maxMP
<p>Gets the maximum mana of the current player.</p>


Return type: number

### level
<p>Gets the level of the current player.</p>


Return type: number

### gold
<p>Gets the gold of the current player.</p>


Return type: number

### afk
<p>Checks if the current player is AFK.</p>


Return type: boolean

### position
<p>The player's current position.</p>


Return type: {x: number, y: number}

### cell
<p>Get the cell of the current player in the map.</p>


Return type: string

### pad
<p>Get the pad of the current player in the map.</p>


Return type: string

### loaded
<p>Whether the player art and inventory has loaded.</p>


Return type: boolean

## Methods

### isMember()
Checks if the current player has membership.


Return type: boolean

### walkTo(x: number, y: number)
Walk to a position in the map.


Return type: void