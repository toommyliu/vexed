import { Command } from "@botting/command";
import { AutoZone } from "../../autozone";

export class CommandAutoZoneLedgermayne extends Command {
  public override execute() {
    AutoZone.map = "ledgermayne";
  }

  public override toString(): string {
    return "Set auto zone: Ledgermayne";
  }
}
