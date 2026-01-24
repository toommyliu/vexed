import { ConditionCommand } from "./ConditionCommand";

export class CommandCanBuyItem extends ConditionCommand {
  public item!: number | string;

  private getItemName(): string | null {
    if (typeof this.item === "string") {
      const numItem = Number.parseInt(this.item, 10);
      if (!Number.isNaN(numItem)) {
        // string id
        const item = this.bot.shops.getById(numItem);
        return item ? item.name : null;
      }

      // string name
      return this.item;
    } else if (typeof this.item === "number") {
      const item = this.bot.shops.getById(this.item);
      return item ? item.name : null;
    }

    return null;
  }

  public override async getCondition(): Promise<boolean> {
    const itemName = this.getItemName();
    return itemName ? this.bot.shops.canBuyItem(itemName) : false;
  }

  public override toString(): string {
    return `Can buy item: ${this.item}`;
  }
}
