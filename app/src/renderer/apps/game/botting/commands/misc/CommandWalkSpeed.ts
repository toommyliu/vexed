import { Command } from "~/botting/command";

export class CommandWalkSpeed extends Command {
  public speed!: number;

  protected override _skipDelay = true;

  public override executeImpl() {
    this.bot.settings.walkSpeed = this.speed;
  }

  public override toString() {
    return `Set walk speed: ${this.speed}`;
  }
}
