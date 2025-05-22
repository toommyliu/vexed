import { Command } from "../../command";

export class CommandWalkSpeed extends Command {
  public speed!: number;

  public override skipDelay = true;

  public override execute() {
    this.bot.settings.walkSpeed = this.speed;
  }

  public override toString() {
    return `Set walk speed: ${this.speed}`;
  }
}
