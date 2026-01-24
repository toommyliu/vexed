import { Command } from "../../command";

export class CommandDelay extends Command {
  public delay!: number;

  public override async executeImpl() {
    await this.bot.sleep(this.delay);
  }

  public override toString() {
    return `Delay: ${this.delay}`;
  }
}
