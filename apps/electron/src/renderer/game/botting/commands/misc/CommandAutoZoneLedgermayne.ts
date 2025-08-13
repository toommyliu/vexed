import { Command } from "@botting/command";

export class CommandAutoZoneLedgermayne extends Command {
  public override execute() {
    this.ctx.autoZone = "ledgermayne";
  }

  public override toString(): string {
    return "Set auto zone: Ledgermayne";
  }
}
