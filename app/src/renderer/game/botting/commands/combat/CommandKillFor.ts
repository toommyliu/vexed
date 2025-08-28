import { Command } from "@botting/command";
import type { KillOptions } from "@lib/Combat";

export class CommandKillFor extends Command {
  public target!: string;

  public item!: number | string;

  public quantity!: number;

  public isTemp: boolean = false;

  public options!: Partial<KillOptions>;

  public override async execute() {
    if (this.isTemp) {
      await this.bot.combat.killForTempItem(
        this.target,
        this.item,
        this.quantity,
        this.options,
      );
    } else {
      await this.bot.combat.killForItem(
        this.target,
        this.item,
        this.quantity,
        this.options,
      );
    }
  }

  public override toString(): string {
    return `Kill for${this.isTemp ? " temp" : ""} item: [${this.target}] [x${this.quantity} ${this.item}]`;
  }
}
