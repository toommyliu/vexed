import { Command } from "@botting/command";
import type { KillOptions } from "@lib/Combat";

export class CommandKill extends Command {
  public target!: string;

  public options!: Partial<KillOptions>;

  public override async execute(): Promise<void> {
    const ac = new AbortController();
    const signal = ac.signal;

    this.ctx.once("end", () => ac.abort());

    await this.bot.combat.kill(this.target, { signal, ...this.options });
  }

  public override toString() {
    return `Kill: ${this.target}`;
  }
}
