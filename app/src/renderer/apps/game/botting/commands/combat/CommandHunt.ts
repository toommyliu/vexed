import { Command } from "../../command";

export class CommandHunt extends Command {
  public target!: string;

  public most?: boolean = false;

  public override async executeImpl() {
    await this.bot.world.hunt(this.target, this.most);
  }

  public override toString() {
    return `Hunt: ${this.target}${this.most ? " [most]" : ""}`;
  }
}
