import type { KillOptions } from "../../../lib/Combat";
import { Command } from "../../command";

export class CommandKill extends Command {
  public target!: string;

  public options!: Partial<KillOptions>;

  public override async executeImpl() {
    const ac = new AbortController();
    const signal = ac.signal;

    const endHandler = () => ac.abort();
    this.ctx.on("end", endHandler);

    try {
      await this.bot.combat.kill(this.target, { signal, ...this.options });
    } finally {
      this.ctx.off("end", endHandler);
    }
  }

  public override toString() {
    return `Kill: ${this.target}`;
  }
}
