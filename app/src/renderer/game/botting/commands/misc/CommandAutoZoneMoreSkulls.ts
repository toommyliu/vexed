import { Command } from "@botting/command";

export class CommandAutoZoneMoreSkulls extends Command {
  public override execute() {
    this.ctx.autoZone = "moreskulls";
  }

  public override toString(): string {
    return "Set auto zone: More Skulls";
  }
}
