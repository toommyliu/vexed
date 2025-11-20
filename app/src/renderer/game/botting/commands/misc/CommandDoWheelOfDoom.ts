import type { ItemData } from "@/renderer/game/lib/models/Item";
import { Command } from "@botting/command";

const GEAR_OF_DOOM = "Gear of Doom";
const TREASURE_POTION = "Treasure Potion";
const TARGET_QTY = 3;
const QUEST_ID = 3_076;

export class CommandDoWheelOfDoom extends Command {
  public bank: boolean = false;

  public override async executeImpl() {
    const hasItem = await this.checkItemStatus();
    if (!hasItem) return;

    this.logger.debug("Doing Wheel of Doom");

    await this.bot.world.join("doom");
    await this.bot.quests.accept(QUEST_ID);

    if (!this.bot.quests.get(QUEST_ID)?.canComplete()) {
      this.logger.debug("Still cannot complete quest?");
      return;
    }

    const fn = this.pext.bind(this);
    this.bot.on('pext', fn);

    await this.bot.quests.complete(QUEST_ID);
    await this.bot.sleep(2_000);

    this.bot.off('pext', fn);
  }

  private async pext(packet: Record<string, unknown>) {
    if (typeof packet !== 'object') return;

    const pkt = packet as PextPacket;
    if (pkt?.params?.type !== 'json' || pkt?.params?.dataObj?.cmd !== 'Wheel') return;

    // {"params":{"dataObj":{"cmd":"Wheel","dropQty":2,"dropItems":{"ITEM_ID": ITEM_DATA},{"ITEM_ID": ITEM_DATA},...}},"type":"json"}
    // maybe {"Item": ITEM_DATA} too

    const items: Record<string, ItemData> = pkt?.params?.dataObj?.dropItems || {};
    if (pkt?.params?.dataObj?.Item) {
      const item = pkt?.params?.dataObj?.Item;
      items[String(item.ItemID)] = item;
    }

    const itemIds = Object.keys(items);

    for (const itemId of itemIds) {
      // console.log(`GOT ITEM FROM WHEEL OF DOOM: ${itemId} - ${items?.[itemId]?.sName}`);

      const itemObj = items[itemId];
      if (this.bank && itemObj && itemObj?.sName !== TREASURE_POTION /* Treasure Potion is unbankable */) {
        await this.bot.bank.open(true);
        await this.bot.bank.deposit(itemObj?.sName);
        this.logger.debug(`Deposited ${itemObj?.sName} into bank.`);
      }
    }
  }

  private async checkItemStatus() {
    if (!this.bot.inventory.contains(GEAR_OF_DOOM)) {
      await this.bot.bank.open();
      if (!this.bot.bank.contains(GEAR_OF_DOOM, TARGET_QTY)) return false;

      await this.bot.bank.withdraw(GEAR_OF_DOOM);
    }

    return this.bot.inventory.contains(GEAR_OF_DOOM, TARGET_QTY);
  }

  public override toString() {
    return `Do Wheel of Doom [to bank: ${this.bank}]`;
  }
}

type PextPacket = {
  params: {
    dataObj: {
      Item?: ItemData; // one of the rewards
      cmd: "Wheel";
      dropItems: { // Treasure Chest, boosts..
        [itemId: string]: ItemData;
      };
    };
    type: "json";
  }
}