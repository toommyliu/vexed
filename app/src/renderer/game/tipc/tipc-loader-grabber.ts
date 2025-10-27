import { Bot } from "@lib/Bot";
import { handlers } from "@shared/tipc";
import { GrabberDataType, LoaderDataType } from "@shared/types";

const bot = Bot.getInstance();

handlers.loaderGrabber.load.listen(async ({ type, id }) => {
  if (!bot.player.isReady()) return;

  switch (type) {
    case LoaderDataType.HairShop:
      bot.shops.loadHairShop(id);
      break;
    case LoaderDataType.Shop:
      await bot.shops.load(id);
      break;
    case LoaderDataType.Quest:
      await bot.quests.load(id);
      break;
    case LoaderDataType.ArmorCustomizer:
      bot.shops.openArmorCustomizer();
      break;
  }
});

handlers.loaderGrabber.grab.handle(async ({ type }) => {
  if (!bot.player.isReady()) return;

  switch (type) {
    case GrabberDataType.Shop:
      if (!bot.shops.isShopLoaded()) return [];
      return bot.shops.info;
    case GrabberDataType.Quest:
      return bot.flash.call(() => swf.questsGetTree());
    case GrabberDataType.Inventory:
      return bot.flash.call(() => swf.inventoryGetItems());
    case GrabberDataType.TempInventory:
      return bot.flash.call(() => swf.tempInventoryGetItems());
    case GrabberDataType.Bank:
      return bot.flash.call(() => swf.bankGetItems());
    case GrabberDataType.CellMonsters:
      return bot.flash.call(() => swf.worldGetCellMonsters());
    case GrabberDataType.MapMonsters:
      return Array.from(bot.world.monsters.values()).map((mon) => mon.data);
  }
});
