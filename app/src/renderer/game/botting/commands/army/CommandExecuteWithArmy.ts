import type { Bot } from "@lib/Bot";
import { ArmyCommand } from "./ArmyCommand";

export class CommandExecuteWithArmy extends ArmyCommand {
  public fn!: (bot: Bot) => Promise<void>;

  public fnName?: string;

  public override async executeImpl() {
    await this.executeWithArmy(async () => {
      await this.fn?.(this.bot);
    });
  }

  public override toString(): string {
    return `Execute with army${this.fnName ? `: ${this.fnName}` : ""}`;
  }
}
