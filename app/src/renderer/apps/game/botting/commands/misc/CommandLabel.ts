import { Command } from "../../command";

export class CommandLabel extends Command {
  public label!: string;

  protected override _skipDelay = true;

  public override executeImpl() {}

  public override toString() {
    return `Label: ${this.label}`;
  }
}
