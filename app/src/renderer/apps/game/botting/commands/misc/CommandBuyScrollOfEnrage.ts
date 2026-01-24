import { Command } from "~/botting/command";

export class CommandBuyScrollOfEnrage extends Command {
  public qty!: number;

  private static readonly ITEM_NAME = "Scroll of Enrage";

  private static QUEST_ID = 2_330;

  private static SHOP_ID = 693;

  public override async executeImpl() {
    if (
      this.bot.inventory.contains(CommandBuyScrollOfEnrage.ITEM_NAME, this.qty)
    ) {
      return;
    }

    await this.bot.bank.withdrawMultiple([
      "Gold Voucher 100k",
      "Arcane Quill",
      "Zealous Ink",
    ]);

    await this.bot.world.join("spellcraft");
    await this.bot.shops.load(CommandBuyScrollOfEnrage.SHOP_ID);

    while (
      this.ctx.isRunning() &&
      !this.bot.inventory.contains(CommandBuyScrollOfEnrage.ITEM_NAME, this.qty)
    ) {
      if (this.bot.drops.hasDrop(CommandBuyScrollOfEnrage.ITEM_NAME)) {
        await this.bot.drops.pickup(CommandBuyScrollOfEnrage.ITEM_NAME);
      }

      await this.bot.quests.accept(CommandBuyScrollOfEnrage.QUEST_ID);

      if (!this.bot.inventory.contains("Gold Voucher 100k", 1)) {
        if (this.bot.player.gold < 100_000) break;

        await this.bot.shops.buyByName("Gold Voucher 100k", 1);
      }

      if (!this.bot.inventory.contains("Arcane Quill", 1)) {
        if (this.bot.player.gold < 100_000) break;

        await this.bot.shops.buyByName("Arcane Quill", 1);
      }

      if (!this.bot.inventory.contains("Zealous Ink", 5)) {
        const arcaneQuillQty =
          this.bot.inventory.get("Arcane Quill")?.quantity ?? 0;

        if (arcaneQuillQty < 1) break;

        await this.bot.shops.buyByName("Zealous Ink", 5);
      }

      await this.bot.quests.complete(CommandBuyScrollOfEnrage.QUEST_ID, 5);
    }
  }

  public override toString(): string {
    return `Buy Scroll of Enrage: ${this.qty}`;
  }
}
