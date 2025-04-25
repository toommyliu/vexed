import { Command } from "../../command";

export class CommandArmyJoin extends Command {
  public mapName!: string;

  public cellName!: string;

  public padName!: string;

  public override async execute() {
    await this.bot.world.join(this.mapName, this.cellName, this.padName);
    await this.bot.army.waitForAll();
  }

  public override toString() {
    return `Army join: ${this.mapName} [${this.cellName}:{${this.padName}]`;
  }
}
