import { stopAggromon } from "../../../util/aggromon";
import { Command } from "../../command";

export class CommandStopAggroMon extends Command {
  public override async execute(): Promise<void> {
    stopAggromon();
  }

  public override toString(): string {
    return "Stop aggromon";
  }
}
