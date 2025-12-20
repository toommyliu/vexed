import { Command } from "~/botting/command";
import { huntMonster } from "~/utils/huntMonster";

export class CommandHunt extends Command {
  public target!: string;

  public most?: boolean = false;

  public override async executeImpl() {
    const cell = await huntMonster(this.bot, this.target, { most: this.most });

    if (!cell) {
      this.logger.debug(`No target cell found for: ${this.target}`);
      return;
    }

    this.logger.debug(`Hunted to cell: ${cell} for target: ${this.target}`);
  }

  public override toString() {
    return `Hunt: ${this.target}${this.most ? " [most]" : ""}`;
  }
}
