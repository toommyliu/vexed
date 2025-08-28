import { Command } from "@botting/command";
import { startAggromon } from "@utils/aggromon";

export class CommandStartAggroMon extends Command {
  public monstersList!: string[];

  public override async execute(): Promise<void> {
    startAggromon(this.monstersList);
  }

  public override toString(): string {
    return `Start aggromon: ${this.monstersList.join(", ")}`;
  }
}
