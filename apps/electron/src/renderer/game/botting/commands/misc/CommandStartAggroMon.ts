import { startAggromon } from "../../../util/aggromon";
import { Command } from "../../command";

export class CommandStartAggroMon extends Command {
  public monstersList!: string[];

  public override async execute(): Promise<void> {
    startAggromon(this.monstersList);
  }

  public override toString(): string {
    return `Start aggromon: ${this.monstersList.join(", ")}`;
  }
}
