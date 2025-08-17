import { Command } from "@botting/command";

export class CommandAutoZoneDarkCarnax extends Command {
  public override execute() {
    this.ctx.autoZone = "darkcarnax";
  }

  public override toString(): string {
    return "Set auto zone: Dark Carnax";
  }
}
