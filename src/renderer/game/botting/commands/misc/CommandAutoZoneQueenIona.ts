import { Command } from "../../command";

export class CommandAutoZoneQueenIona extends Command {
  public execute() {
    this.ctx.autoZone = "queeniona";
  }

  public toString(): string {
    return "Set auto zone: Queen Iona";
  }
}
