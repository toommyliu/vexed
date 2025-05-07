---
outline: deep
---

# Bot ​<Badge type="info">extends TypedEmitter</Badge>

---

### Properties

#### army

Type: `Army`

The army API class instance.

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
| `maxIterations` | `number` | ✓ | `15` | The maximum number of iterations to wait. -1 to wait indefinitely. |

**Returns:** `Promise<void>`

