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

## Kill monster for item

```js
await world.join("citadel-1e99", "m13", "Right");
settings.setInfiniteRange();
combat.skillSet = [2, 3, 4]; // skill set to use
await combat.killForItem(
    "belrot the fiend", // monster name, case insensitive
    "belrot the fiend essence", // item name or item id, case insensitive
    100 // item count
);
```

## Logging in

```js
if (!auth.loggedIn) {
    auth.login("username", "password");
    await bot.waitUntil(() => auth.servers?.length > 0);
    const servers = auth.servers.filter(s => s.name !== "Artix" && s.name !== "Sir Ver");
    const server = servers[Math.floor(Math.random() * servers.length)];
    await auth.connect(server.name);
    await bot.waitUntil(() => flash.get('world.myAvatar.invLoaded', true) && flash.call('world.myAvatar.pMC.artLoaded'));
    await bot.sleep(1000);
}
```

## Complete a quest with selectable reward

```js
var q_id = 4813;
await quests.load(q_id);
await quests.accept(q_id);
await world.join("graveyard", "Center", "Left");
settings.setInfiniteRange();
await combat.killForItem('Skeletal Viking', 'Nornir Triad Shard', 12, true);
await bot.sleep(1000);
/* quest id, # of turn ins, selected reward */
await quests.complete(q_id, 1, 33502 /* amulet of glory */ );
```

## Sell an item by name

```js
var s_id = 211;
await world.join("arcangrove", "Potion", "Right");
await shops.load(s_id);
await shops.sell("Mana Potion");
```