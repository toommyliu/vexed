---
outline: deep
---

# Example Scripts

These examples showcase just a few possibilities of what is possible. They can be used as-is, or as a starting point for your own scripts.

If you'd like to contribute your own examples, please [open an issue](https://github.com/toommyliu/vexed/issues/new).

## Shop

::: code-group

```js:line-numbers [buy by id]
const shop_id = 41; // armor shop
const item_id = 774; // peasant rags
const quantity = 1;
await world.join("yulgar");
await shops.load(shop_id);
await shops.buyById(item_id, quantity);
```

```js:line-numbers [buy by name]
const shop_id = 211; // reens' potion shop
const item_name = 'Scroll of Life Steal';
const quantity = 99;
await world.join("arcangrove-1e99", "Potion", "Right");
await shops.load(shop_id);
await shops.buyByName(item_name, quantity);
```

```js:line-numbers [sell by name]
const shop_id = 211;
await world.join("arcangrove", "Potion", "Right");
// technically, we could have loaded any valid shop
await shops.load(shop_id);
await shops.sell("Mana Potion");
```

:::

## Farming

:::code-group

```js:line-numbers [basic]
const id = 11;

await quests.accept(id);
await world.join("farm-1e99", "End");
await combat.killForTempItem("Treeant", "Treeant Branch", 1);
await quests.complete(id);
```

```js:line-numbers [selectable reward]
const questId = 4813;
await quests.accept(questId);
await world.join("graveyard-1e99", "Center", "Left");
await combat.killForTempItem("Skeletal Viking", "Nornir Triad Shard", 12);
await quests.complete(questId, 1, 33502 /* amulet of glory */);
```

```js:line-numbers [commanding shadow essences]
const sdka = "Sepulchure's DoomKnight Armor";

const e1 = "Empowered Essence";
const e2 = "Malignant Essence";
const items = [sdka,e1,e2];

await bank.withdrawMultiple(items);

if (!inventory.get(sdka)) return;

const questId = 4439;
while (bot.isRunning()) {
    await quests.accept(questId);
    await world.join("shadowrealmpast-1e99");
    await combat.killForItem("*",e1,50);
    await world.jump("r4","Left");
    await combat.killForItem("*",e2,3);
    await quests.complete(questId);
    await world.jump("Enter","Spawn");
    await drops.pickup("Void Aura");
}
```

```js:line-numbers [new world new opportunities]
const questId = 6697; // nulgath birthday pet
const start = {};
const whitelist = [
  "Dark Crystal Shard",
  "Diamond of Nulgath",
  "Unidentified 13",
  "Tainted Gem",
  "Voucher of Nulgath (non-mem)",
  "Totem of Nulgath",
  "Gem of Nulgath",
  "Blood Gem of the Archfiend",
];

bot.on('start', async () => {
	await bank.withdrawMultiple(whitelist);

    for (const item of whitelist) {
        const invItem = inventory.get(item);
        start[item] = invItem !== null ? invItem.quantity : 0;
    }
});

bot.on('stop', () => {
    // Log the final differences
    for (const item of whitelist) {
        const quantity = inventory.get(item)?.quantity ?? 0;
        const diff = quantity - start[item];
        const symbol = diff < 0 ? '-' : '+';
        console.log(`${item} : ${quantity} (${symbol}${Math.abs(diff)})`)
    }
});

// The script
while (bot.isRunning()) {
  await quests.accept(questId);

  await world.join("mobius-1e99", "Slugfit", "Bottom");
  world.loadMapSwf("ChiralValley/town-Mobius-21Feb14.swf");

  await combat.killForTempItem("id.10", "Slugfit Horn", 5);
  await combat.killForTempItem("id.9", "Cyclops Horn", 3);

  await world.join("tercessuinotlim-1e99");
  await combat.killForTempItem("*", "Makai Fang", 5);

  await world.join("hydra-1e99", "Rune2", "Left");
  await combat.killForTempItem("*", "Imp Flame", 3);

  await world.join("greenguardwest-1e99", "West12");
  await combat.killForTempItem("*", "Wereboar Tusk", 2);

  await quests.complete(questId);

  await Promise.all(whitelist.map(async (item) => drops.pickup(item)));
}
```
:::

## Snippets

::: code-group
```js:line-numbers [using auto relogin]
// auto relogin ONLY relogins you in, at this time.
bot.on('start', () => {
  // set the login server
  bot.autoRelogin.server = 'Twig';
  // wait 4 sec after being logged out
  bot.autoRelogin.delay = 4000; // default 5 sec
});

bot.on('login', () => {
  console.log('logged in at', new Date());
});

bot.on('logout', () => {
  console.log('logged out at', new Date());
});
// rest of your code
```

```js:line-numbers [packets]
bot.on('packetFromClient', (packet/*string*/) => {
  // do something
});

bot.on('packetFromServer',(packet/*string*/) => {
  // do something
});

// simulate from server
packets.sendClient('...', 'str');

// send to server
packets.sendServer('...', 'String');

```

```js:line-numbers [interacting with drop stack]
// record (object) of all items that have dropped
for (const [itemId, quantity] of Object.entries(drops.stack)) {
  const itemName = drops.getItemName(itemId);
  console.log(itemName, quantity);
}

// reject a drop
await drops.reject('Bone Dust');

if (drops.hasDrop('Treasure Chest')) {
  const itemId = drops.getItemId('Treasure Chest');
  if (!itemId) return;

  const quantity = drops.getDropCount(itemId);
  // rest of the code
}

// pick up a drop
await drops.pickup('Essence of Nulgath');
```

```js:line-numbers [calling flash interop functions]
// window.swf.getGameObject
// window.swf.getGameObjectS
// window.swf.setGameObject
// window.swf.getArrayObject
// window.swf.setArrayObject
// window.swf.callGameFunction
// window.swf.callGameFunction0
// window.swf.selectArrayObjects
// window.swf.isNull

// you can also call any externalized function
// from the swf file

// toggle fps counter
window.swf.callGameFunction('world.toggleFPS');
:::