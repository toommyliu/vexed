import type { LoaderGrabberLoadRequest } from "~/shared/loader-grabber/types";
import { handlers } from "~/shared/tipc";
import { GrabberDataType, LoaderDataType } from "~/shared/types";
import { Bot } from "../lib/Bot";

const bot = Bot.getInstance();

handlers.loaderGrabber.load.listen(async (input: LoaderGrabberLoadRequest) => {
  if (!bot.player.isReady()) return;
  switch (input.type) {
    case LoaderDataType.HairShop:
      bot.shops.loadHairShop(input.id);
      break;
    case LoaderDataType.Shop:
      await bot.shops.load(input.id);
      break;
    case LoaderDataType.Quest:
      await bot.quests.load(input.id);
      break;
    case LoaderDataType.ArmorCustomizer:
      bot.shops.openArmorCustomizer();
      break;
  }
});

handlers.loaderGrabber.grab.handle(async (result) => {
  if (!result) return;
  if (!bot.player.isReady()) return;
  const { type } = result;
  switch (type) {
    case GrabberDataType.Shop:
      if (!bot.shops.isShopLoaded()) return [];
      return bot.shops.info!;
    case GrabberDataType.Quest:
      return bot.flash.call(() => swf.questsGetTree()) ?? undefined;
    case GrabberDataType.Inventory:
      return bot.flash.call(() => swf.inventoryGetItems()) ?? undefined;
    case GrabberDataType.TempInventory:
      return bot.flash.call(() => swf.tempInventoryGetItems()) ?? undefined;
    case GrabberDataType.Bank:
      return bot.flash.call(() => swf.bankGetItems()) ?? undefined;
    case GrabberDataType.CellMonsters:
      return bot.flash.call(() => swf.worldGetCellMonsters()) ?? undefined;
    case GrabberDataType.MapMonsters:
      return Array.from(bot.world.monsters.all().values()).map(
        (monster) => monster.data,
      );
  }
});
