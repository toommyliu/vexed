import { Command } from "@botting/command";
import { AutoZone } from "../../autozone";

export class CommandAutoZoneQueenIona extends Command {
  public override execute() {
    AutoZone.map = "queeniona";
  }

  public override toString(): string {
    return "Set auto zone: Queen Iona";
  }
}
