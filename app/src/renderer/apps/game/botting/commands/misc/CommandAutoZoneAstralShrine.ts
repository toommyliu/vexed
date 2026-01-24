import { Command } from "~/botting/command";
import { AutoZone } from "../../autozone";

export class CommandAutoZoneAstralShrine extends Command {
  public override executeImpl() {
    AutoZone.map = "astralshrine";
  }

  public override toString(): string {
    return "Set auto zone: Astral Shrine";
  }
}
