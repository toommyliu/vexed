import { Command } from "~/botting/command";
import { AutoZone } from "../../autozone";

export class CommandAutoZoneLedgermayne extends Command {
  public override executeImpl() {
    AutoZone.map = "ledgermayne";
  }

  public override toString(): string {
    return "Set auto zone: Ledgermayne";
  }
}
