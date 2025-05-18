import { ipcRenderer } from "../../../common/ipc";
import { IPC_EVENTS } from "../../../common/ipc-events";
import { Logger } from "../../../common/logger";
import { Bot } from "../lib/Bot";

const logger = Logger.get("IpcLoaderGrabber");
const bot = Bot.getInstance();

ipcRenderer.answerMain(IPC_EVENTS.LOADER_GRABBER_LOAD, async (data) => {
  logger.info(data);

  if (!bot.player.isReady()) return;

  const { type, id } = data;

  switch (type) {
    case "0": // Hair shop
      bot.shops.loadHairShop(id);
      break;
    case "1": // Shop
      await bot.shops.load(id);
      break;
    case "2": // Quest
      await bot.quests.load(id);
      break;
    case "3": // Armor Customizer
      bot.shops.openArmorCustomizer();
      break;
  }
});

ipcRenderer.answerMain(IPC_EVENTS.LOADER_GRABBER_GRAB, async (data) => {
  logger.info(data);

  const { type } = data;
  const ret: { data: unknown; type: string } = {
    data: undefined,
    type,
  };

  if (!bot.player.isReady()) return ret;

  if (type === "0") {
    if (!bot.shops.isShopLoaded()) return ret;

    ret.data = bot.shops.info;
  } else if (type === "1") {
    ret.data = bot.flash.call(() => swf.questsGetTree());
  } else if (type === "2") {
    ret.data = bot.flash.call(() => swf.inventoryGetItems());
  } else if (type === "3") {
    ret.data = bot.flash.call(() => swf.tempInventoryGetItems());
  } else if (type === "4") {
    ret.data = bot.flash.call(() => swf.bankGetItems());
  } else if (type === "5") {
    ret.data = bot.flash.call(() => swf.worldGetCellMonsters());
  } else if (type === "6") {
    ret.data = bot.world.monsters;
  }

  return ret;
});
