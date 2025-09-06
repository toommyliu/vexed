import { Command } from "@botting/command";

/**
 * ## How it works:
 * 1. The condition is evaluated using `getCondition()`
 * 2. If the condition returns `true` (condition is met):
 *    - Execution continues normally to the next command
 * 3. If the condition returns `false` (condition is NOT met):
 *    - The next command is skipped by incrementing the command index
 *
 * ## Inverted Conditions:
 * For "not" conditions (like "is not member"), the `getCondition()` method should
 * return the inverted result:
 * - If player IS a member → condition returns `false` → next command is skipped
 * - If player is NOT a member → condition returns `true` → next command executes
 *
 * This means "condition met" always means "execute the next command", regardless
 * of whether the underlying logic is positive or negative.
 */
export abstract class ConditionCommand extends Command {
  public override skipDelay = true;

  /**
   * Evaluates the condition that determines whether to execute the next command.
   *
   * @returns A promise that resolves to:
   *   - `true` if the next command should execute (condition is "met")
   *   - `false` if the next command should be skipped (condition is "not met")
   */
  public abstract getCondition(): Promise<boolean>;

  public override async execute(): Promise<void> {
    const isConditionMet = await this.getCondition();
    if (!isConditionMet) this.ctx.commandIndex++;
  }
}
