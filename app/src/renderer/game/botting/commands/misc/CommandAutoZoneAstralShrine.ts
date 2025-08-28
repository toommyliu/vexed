import { Command } from "@botting/command";

export class CommandAutoZoneAstralShrine extends Command {
  public override execute() {
    this.ctx.autoZone = "astralshrine";
  }

  public override toString(): string {
    return "Set auto zone: Astral Shrine";
  }
}
