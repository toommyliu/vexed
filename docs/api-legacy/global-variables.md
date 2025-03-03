---
outline: deep
---

# Global Variables

~~The following global variables are available:~~

Use `Bot.getInstance()` to access the following instances:

```js
const bot = Bot.getInstance();
const { auth } = bot;

// rest of the code...
```

## API

- `auth`: [Auth](#auth) instance
- `bank`: [Bank](#bank) instance
- `bot`: [Bot](#bot) instance
- `combat`: [Combat](#combat) instance
- `drops`: [Drops](#drops) instance
- `house`: [House](#house) instance
- `inventory`: [Inventory](#inventory) instance
- `packets`: [Packets](#packets) instance
- `player`: [Player](#player) instance
- `quests`: [Quests](#quests) instance
- `settings`: [Settings](#settings) instance
- `shops`: [Shops](#shops) instance
- `tempInventory`: [TempInventory](#tempinventory) instance
- `world`: [World](#world) instance

> [!NOTE]
> All instances can be directly accessed through `bot`, too.

## Utilities

- `flash`: [Flash](./util/Flash) instance

## Enums

You can simply hardcode the enum values in your scripts.

~~- `GameAction`: [GameAction](./enums/GameAction.md) enum~~

~~- `PlayerState`: [PlayerState](./enums/PlayerState.md) enum~~
