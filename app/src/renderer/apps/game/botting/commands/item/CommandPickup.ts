import { Command } from "~/botting/command";

export class CommandPickup extends Command {
  public item!: number | string;

  public override async executeImpl() {
    await this.bot.drops.pickup(this.item);
  }

  public override toString() {
    return `Pickup: ${this.item}`;
  }
}
