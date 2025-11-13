import { Command } from "@botting/command";
import { AutoZone } from "../../autozone";

export class CommandAutoZoneMoreSkulls extends Command {
  public override execute() {
    AutoZone.map = "moreskulls";
  }

  public override toString(): string {
    return "Set auto zone: More Skulls";
  }
}
