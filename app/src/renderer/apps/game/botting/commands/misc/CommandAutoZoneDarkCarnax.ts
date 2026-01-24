import { Command } from "../../command";
import { AutoZone } from "../../autozone";

export class CommandAutoZoneDarkCarnax extends Command {
  public override executeImpl() {
    AutoZone.map = "darkcarnax";
  }

  public override toString(): string {
    return "Set auto zone: Dark Carnax";
  }
}
