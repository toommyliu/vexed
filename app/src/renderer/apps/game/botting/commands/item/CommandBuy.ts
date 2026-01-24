import { Command } from "~/botting/command";

export class CommandBuy extends Command {
  public shopId!: number;

  public item!: number | string;

  public quantity!: number;

  public auto!: boolean;

  public override async executeImpl() {
    if (!this.getItem()) {
      this.logger.debug(`Load shop: ${this.shopId}`);
      // The item is not found in the current shop, assume it might be a different shop
      await this.bot.shops.load(this.shopId);
    }

    if (this.auto && this.bot.shops.isMergeShop) {
      await this.autoBuy();
      return;
    }

    await this.normalBuy();
  }

  private async normalBuy() {
    const item = this.getItem();

    let hasConfirmed = true;

    if (item?.isAC() && item?.data?.iCost > 0) {
      // eslint-disable-next-line no-alert
      hasConfirmed = confirm(
        `"${item.name}" costs ${item.data.iCost} ACs. Proceed?`,
      );
    }

    if (!hasConfirmed) return;

    // For items with iQty > 1, we need to buy the actual quantity requested
    // since iQty represents how many items come per purchase unit
    let adjustedQuantity = this.quantity;
    if (item && item.data.iQty > 1) {
      // If we want less than a full pack, we still need to buy at least the pack size
      adjustedQuantity = Math.max(this.quantity, item.data.iQty);
    }

    if (typeof this.item === "number") {
      await this.bot.shops.buyById(this.item, adjustedQuantity);
    } else {
      await this.bot.shops.buyByName(this.item, adjustedQuantity);
    }
  }

  private getItem() {
    if (typeof this.item === "number") return this.bot.shops.getById(this.item);
    else return this.bot.shops.getByName(this.item);
  }

  private async autoBuy() {
    const shopItem =
      typeof this.item === "number"
        ? this.bot.shops.getById(this.item)
        : this.bot.shops.getByName(this.item);

    if (!shopItem) {
      return;
    }

    if (!shopItem.data.turnin || shopItem.data.turnin.length === 0) {
      await this.normalBuy();
      return;
    }

    const requirements = shopItem.data.turnin;
    const missingItems: {
      cost: number;
      isAC: boolean;
      name: string;
      needed: number;
    }[] = [];

    for (const req of requirements) {
      if (shopItem.isAC() && shopItem.data.iCost > 0) continue;

      const requiredPerCraft = Number.parseInt(req.iQty, 10);
      const totalNeeded = requiredPerCraft * this.quantity;

      const currentTotal = this.getTotalQuantityAcrossInventories(req.sName);
      const needed = Math.max(0, totalNeeded - currentTotal);

      if (needed > 0) {
        // Get the shop item for the required item to get its cost and available quantity
        const requiredShopItem = this.bot.shops.getByName(req.sName);
        const shopQuantity = requiredShopItem?.data.iQty ?? 1;

        // Calculate how many times we need to buy this item considering shop quantity
        const buyOperations = Math.ceil(needed / shopQuantity);
        const totalQuantityToBuy = buyOperations * shopQuantity;

        missingItems.push({
          name: req.sName,
          needed: totalQuantityToBuy,
          isAC: requiredShopItem?.isAC() ?? false,
          cost: requiredShopItem?.data.iCost ?? 0,
        });
      }
    }

    for (const missing of missingItems) {
      const cost = missing.needed * missing.cost;
      const unit = missing.isAC ? "ACs" : "gold";

      // eslint-disable-next-line no-alert
      const hasConfirmed = confirm(
        `Need to buy ${missing.needed}x ${missing.name} for ${cost} ${unit}. Proceed?`,
      );

      if (!hasConfirmed) return;

      const requiredShopItem = this.bot.shops.getByName(missing.name);
      const shopQuantity = requiredShopItem?.data.iQty ?? 1;

      if (this.bot.shops.canBuyItem(missing.name)) {
        // How many buy operations we need to perform based on shop quantity
        const buyOperations = Math.ceil(missing.needed / shopQuantity);

        for (let ops = 0; ops < buyOperations; ops++) {
          await this.bot.shops.buyByName(missing.name, shopQuantity);
        }
      } else {
        // TODO: Runtime logging
      }
    }

    await this.normalBuy();
  }

  private getTotalQuantityAcrossInventories(itemName: string): number {
    let total = 0;

    const invItem = this.bot.inventory.get(itemName);
    total += invItem?.quantity ?? 0;

    const tempItem = this.bot.tempInventory.get(itemName);
    total += tempItem?.quantity ?? 0;

    return total;
  }

  public override toString() {
    return `Buy item: ${this.quantity}x ${this.item}${this.auto ? " [auto]" : ""}`;
  }
}
