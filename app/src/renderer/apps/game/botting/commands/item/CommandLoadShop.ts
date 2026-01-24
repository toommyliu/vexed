import { Command } from "../../command";

export class CommandLoadShop extends Command {
  public shopId!: number;

  public override async executeImpl() {
    await this.bot.shops.load(this.shopId);
  }

  public override toString() {
    return `Load Shop: ${this.shopId}`;
  }
}
