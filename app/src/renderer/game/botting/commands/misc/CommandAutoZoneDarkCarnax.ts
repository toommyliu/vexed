import { Command } from "@botting/command";
import { AutoZone } from "../../autozone";

export class CommandAutoZoneDarkCarnax extends Command {
  public override execute() {
    AutoZone.map = "darkcarnax";
  }

  public override toString(): string {
    return "Set auto zone: Dark Carnax";
  }
}
