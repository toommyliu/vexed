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

let turnins = 0;

const whitelist = [
	"Dark Crystal Shard",
	"Diamond of Nulgath",
	"Unidentified 13",
	"Tainted Gem",
	"Voucher of Nulgath (non-mem)",
	"Totem of Nulgath",
	"Gem of Nulgath",
	"Blood Gem of the Archfiend"
];

while (bot.running) {
	settings.infiniteRange = true;

	console.log(`New World, New Opportunities: completed ${turnins++} times`);

	for await (const item of whitelist) {
		await bank.open();
		await bot.sleep(2000);

		const bankItem = bank.get(item);
		const inventoryItem = inventory.get(item);

		if (bankItem) {
			await bot.sleep(2000);
			await bank.withdraw(item);
			console.log(`${item}: ${inventoryItem.quantity}x`);
		} else if (inventoryItem) {
			console.log(`${item}: ${inventoryItem.quantity}x`);
		} else {
			console.log(`${item}: not found`);
		}
	}

	await quests.accept(questId);

	await world.join('mobius-1e99', 'Slugfit', 'Bottom');
	world.loadMap('ChiralValley/town-Mobius-21Feb14.swf');

	await combat.killForTempItem('id.10', 'Slugfit Horn', 5);
	await combat.killForTempItem('id.9', 'Cyclops Horn', 3);

	await world.join('tercessuinotlim-1e99');
	await combat.killForTempItem('*', 'Makai Fang', 5);

	await world.join('hydra-1e99', 'Rune2', 'Left');
	await combat.killForTempItem('*', 'Imp Flame', 3);

	await world.join('greenguardwest-1e99', 'West12');
	await combat.killForTempItem('*', 'Wereboar Tusk', 2);

	await quests.complete(questId, 1);

	for (const item of whitelist) {
		await drops.pickup(item);
	}
}

console.log(`New World, New Opportunities: completed ${turnins} times`);
```
