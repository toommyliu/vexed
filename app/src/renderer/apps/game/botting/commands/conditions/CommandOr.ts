import { ConditionCommand } from "./ConditionCommand";

export class CommandOr extends ConditionCommand {
  public conditions: ConditionCommand[] = [];

  public override async getCondition(): Promise<boolean> {
    const results = await Promise.all(
      this.conditions.map(async (cmd) => cmd.getCondition()),
    );
    return results.some(Boolean);
  }

  public override toString(): string {
    return `OR(${this.conditions.map((cmd) => cmd.toString()).join(" || ")})`;
  }
}
