import { ConditionCommand } from "./ConditionCommand";

export class CommandAnd extends ConditionCommand {
  public conditions: ConditionCommand[] = [];

  public override async getCondition(): Promise<boolean> {
    const results = await Promise.all(
      this.conditions.map(async (condition) => condition.getCondition()),
    );
    return results.every(Boolean);
  }

  public override toString(): string {
    return `AND(${this.conditions.map((cmd) => cmd.toString()).join(", ")})`;
  }
}
