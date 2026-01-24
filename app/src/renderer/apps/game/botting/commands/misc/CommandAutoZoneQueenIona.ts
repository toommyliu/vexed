import { Command } from "../../command";
import { AutoZone } from "../../autozone";

export class CommandAutoZoneQueenIona extends Command {
  public override executeImpl() {
    AutoZone.map = "queeniona";
  }

  public override toString(): string {
    return "Set auto zone: Queen Iona";
  }
}
