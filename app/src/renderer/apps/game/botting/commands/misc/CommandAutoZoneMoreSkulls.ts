import { Command } from "../../command";
import { AutoZone } from "../../autozone";

export class CommandAutoZoneMoreSkulls extends Command {
  public override executeImpl() {
    AutoZone.map = "moreskulls";
  }

  public override toString(): string {
    return "Set auto zone: More Skulls";
  }
}
