import { Command } from "../../command";

export class CommandAutoZoneUltraDage extends Command {
  public override execute() {
    this.ctx.autoZone = "ultradage";
  }

  public override toString(): string {
    return "Set auto zone: Ultra Dage";
  }
}
