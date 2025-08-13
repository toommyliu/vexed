import { Command } from "@botting/command";
import { stopAggromon } from "@utils/aggromon";

export class CommandStopAggroMon extends Command {
  public override async execute(): Promise<void> {
    stopAggromon();
  }

  public override toString(): string {
    return "Stop aggromon";
  }
}
