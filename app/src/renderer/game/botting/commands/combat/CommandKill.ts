import { Command } from "@botting/command";
import type { KillOptions } from "@lib/Combat";

export class CommandKill extends Command {
  public target!: string;

  public options!: Partial<KillOptions>;

  public override async execute(): Promise<void> {
    await this.bot.combat.kill(this.target, this.options);
  }

  public override toString() {
    return `Kill: ${this.target}`;
  }
}
