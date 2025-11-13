import { Command } from "@botting/command";
import { AutoZone } from "../../autozone";

export class CommandAutoZoneUltraDage extends Command {
  public override executeImpl() {
    AutoZone.map = "ultradage";
  }

  public override toString(): string {
    return "Set auto zone: Ultra Dage";
  }
}
