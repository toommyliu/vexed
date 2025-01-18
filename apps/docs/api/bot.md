---
outline: deep
---

# Bot ​<Badge type="info">extends EventEmitter</Badge>

---

### Events

#### login

This event is emitted when the player logs in.

Type: `() => void`

#### logout

This event is emitted when the player logs out.

Type: `() => void`

#### start

This event is emitted when a script is started.

Type: `() => void`

#### stop

This event is emitted when a script is stopped.

Type: `() => void`

#### error

This event is emitted when an error occurs during a script.

Type: `(error: Error) => void`

#### monsterDeath

This event is emitted when a monster has died.

Type: `(monster: Monster) => void`

#### monsterRespawn

This event is emitted when a monster has respawned.

Type: `(monster: Monster) => void`

#### packetFromServer

This event is emitted when a packet is received from the server.

Type: `(packet: string) => void`

#### packetFromClient

This event is emitted when a packet is sent to the server.

Type: `(packet: string) => void`

#### playerLeave

This event is emitted when a player leaves the room.

Type: `(playerName: string) => void`

### Properties

#### ac

Type: `AbortController | null`

The AbortController instance.

#### auth

Type: `Auth`

The Auth API class instance.

#### bank

Type: `Bank`

The Bank API class instance.

#### combat

Type: `Combat`

The Combat API class instance.

#### drops

Type: `Drops`

The Drops API class instance.

#### house

Type: `House`

The House API class instance.

#### inventory

Type: `Inventory`

The Inventory API class instance.

#### player

Type: `Player`

The local Player API class instance.

#### packets

Type: `Packets`

The Packets API class instance.

#### quests

Type: `Quests`

The Quests API class instance.

#### settings

Type: `Settings`

The Settings API class instance.

#### shops

Type: `Shops`

The Shops API class instance.

#### tempInventory

Type: `TempInventory`

The TempInventory API class instance.

#### world

Type: `World`

The World API class instance.

#### autoRelogin

Type: `AutoRelogin`

The AutoRelogin API class instance.

#### flash

Type: `Flash`

The Flash API class instance.

#### timerManager

Type: `TimerManager`

The TimerManager API class instance.

#### signal

​<Badge type="info">getter</Badge>Used to keep track of the current AbortController signal.

Type: `AbortSignal | null`

### Methods

#### sleep

Pauses execution for a specified amount of time.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `ms` | `number` | The number of milliseconds to wait. |

**Returns:** `Promise<void>`

#### waitUntil

Waits until the condition is met.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `condition` | `() => boolean` |  |  | The condition to wait for until it returns true. |
| `prerequisite` | `(() => boolean) \| null` | ✓ | `null` | The prerequisite to be checked before waiting for the condition. |
| `timeout` | `number` | ✓ | `15` | The maximum number of iterations to wait. -1 to wait indefinitely. |

**Returns:** `Promise<void>`

#### isRunning

Whether the bot is running.

**Returns:** `boolean`

