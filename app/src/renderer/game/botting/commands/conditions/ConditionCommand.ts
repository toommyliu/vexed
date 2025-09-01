import { Command } from "@botting/command";

export class ConditionCommand extends Command {
  public override skipDelay = true;

  /**
   * The condition to evaluate, with no side effects.
   *
   * @returns True if the condition is satisfied, false otherwise.
   */
  public async getCondition(): Promise<boolean> {
    throw new Error("evaluate() not implemented");
  }

  public override async execute(): Promise<void> {
    const res = await this.getCondition();
    if (!res) this.ctx.commandIndex++;
  }
}
