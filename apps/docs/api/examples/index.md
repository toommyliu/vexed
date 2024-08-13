# Examples

If you have any suggestions or requests for any examples, feel free to create an issue or PR.

## Buy an item from the shop by id

```js
var shop_id = 41;
var item_id = 774;
var item_shop_id = 949;
var quantity = 1;
await world.join("yulgar");
await shops.load(shop_id);
await shops.buyByID(item_id, item_shop_id, quantity);
```

## Logging in

```js
if (!auth.loggedIn) {
  auth.login("username", "password");
  await bot.waitUntil(() => auth.servers.length > 0);

  const servers = auth.servers.filter(
    (srv) => srv.name !== "Artix" && srv.name !== "Sir Ver"
  );
  const server = servers[Math.floor(Math.random() * servers.length)];

  await bot.waitUntil(
    () => flash.get("mcLogin.currentLabel", true) === "Servers"
  ); // Wait for server select screen
  await auth.connectTo(server.name);
  await bot.waitUntil(() => !world.loading && player.loaded);
  console.log("Logged in");
}
```

## Complete a quest with selectable reward

```js
const questId = 4813;
await quests.accept(questId);
await world.join("graveyard-1e99", "Center", "Left");
await combat.killForTempItem("Skeletal Viking", "Nornir Triad Shard", 12);
await bot.sleep(1000);
await quests.complete(questId, 1, 33502 /* amulet of glory */);
```

## Sell an item by name

```js
var s_id = 211;
await world.join("arcangrove", "Potion", "Right");
await shops.load(s_id);
await shops.sell("Mana Potion");
```

## New World New Opportunities

```js
const questId = 6697;
await quests.accept(questId);

const rewards = quests.get(questId).rewards.map((i) => i.itemName); // itemID

//Slugfit Horn
await world.join('mobius-1e99', 'Slugfit', 'Bottom');
world.loadSWF('ChiralValley/town-Mobius-21Feb14.swf');

while (!tempInventory.contains('Slugfit Horn', 5)) {
    await combat.kill('id.10'); //slugfit
    await bot.sleep(1000);
}
while (!tempInventory.contains('Cyclops Horn', 3)) {
    await combat.kill('id.9'); //cyclops
    await bot.sleep(1000);
}

await world.join('tercessuinotlim-1e99', 'Top', 'Right');
await combat.killForTempItem('*', 'Makai Fang', 5);

await world.join('hydra-1e99', 'Rune2', 'Left');
await combat.killForTempItem('*', 'Imp Flame', 3);

await world.join('greenguardwest-1e99', 'Big Bad Boar', 'Wereboar Tusk', 2);
await combat.killForTempItem('*', 'Wereboar Tusk', 2);

await quests.complete(questId, 1);
```
