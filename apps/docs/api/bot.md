---
outline: deep
---

# Bot

---

### Properties

#### ac

Type: [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) | [null](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/null)

The AbortController instance.

#### auth

Type: [Auth](.Auth.md)

The Auth API class instance.

#### bank

Type: [Bank](.Bank.md)

The Bank API class instance.

#### combat

Type: [Combat](.Combat.md)

The Combat API class instance.

#### drops

Type: [Drops](.Drops.md)

The Drops API class instance.

#### house

Type: [House](.House.md)

The House API class instance.

#### inventory

Type: [Inventory](.Inventory.md)

The Inventory API class instance.

#### player

Type: [Player](.Player.md)

The local Player API class instance.

#### packets

Type: [Packets](.Packets.md)

The Packets API class instance.

#### quests

Type: [Quests](.Quests.md)

The Quests API class instance.

#### settings

Type: [Settings](.Settings.md)

The Settings API class instance.

#### shops

Type: [Shops](.Shops.md)

The Shops API class instance.

#### tempInventory

Type: [TempInventory](.TempInventory.md)

The TempInventory API class instance.

#### world

Type: [World](.World.md)

The World API class instance.

#### autoRelogin

Type: [AutoRelogin](.AutoRelogin.md)

The AutoRelogin API class instance.

#### flash

Type: [Flash](.Flash.md)

The Flash API class instance.

#### timerManager

Type: [TimerManager](.TimerManager.md)

The TimerManager API class instance.

#### signal

​<Badge type="info">getter</Badge>Used to keep track of the current AbortController signal.

Type: [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) | [null](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/null)

### Methods

#### sleep

Pauses execution for a specified amount of time.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `ms` | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | The number of milliseconds to wait. |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

#### waitUntil

Waits until the condition is met.

**Parameters:**

| Name | Type | Optional | Default | Description |
|------|------|----------|---------|-------------|
| `condition` | () => boolean |  |  | The condition to wait for until it returns true. |
| `prerequisite` | (() => boolean) \| [null](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/null) | ✓ | `null` | The prerequisite to be checked before waiting for the condition. |
| `timeout` | [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) | ✓ | `15` | The maximum number of iterations to wait. -1 to wait indefinitely. |

**Returns:** [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)>

#### isRunning

Whether the bot is running.

**Returns:** [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)

