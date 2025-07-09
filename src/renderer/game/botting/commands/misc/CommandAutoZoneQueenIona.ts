import { Command } from "../../command";

export class CommandAutoZoneQueenIona extends Command {
  public override execute() {
    this.ctx.autoZone = "queeniona";
  }

  public override toString(): string {
    return "Set auto zone: Queen Iona";
  }
}
