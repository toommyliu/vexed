import type { ItemData } from "@vexed/game";
import { Bot } from "~/lib/core/Bot";
import { handlers } from "~/shared/tipc";
import { GrabberDataType, LoaderDataType } from "~/shared/types";

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
      return bot.flash.getWithDefault<ItemData[]>("world.myAvatar.items", []);
    case GrabberDataType.TempInventory:
      return bot.flash.getWithDefault<ItemData[]>(
        "world.myAvatar.tempitems",
        [],
      );
    case GrabberDataType.Bank:
      return bot.flash.getWithDefault<ItemData[]>("world.mybankinfo.items", []);
    case GrabberDataType.CellMonsters:
      return bot.flash.call(() => swf.worldGetCellMonsters());
    case GrabberDataType.MapMonsters:
      return bot.world.monsters;
  }
});
