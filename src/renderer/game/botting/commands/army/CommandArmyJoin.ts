import { ArmyCommand } from "./ArmyCommand";

export class CommandArmyJoin extends ArmyCommand {
  public mapName!: string;

  public cellName!: string;

  public padName!: string;

  public override async execute(): Promise<void> {
    await this.executeWithArmy(async () => {
      await this.bot.world.join(this.mapName, this.cellName, this.padName);
    });
  }

  public override toString(): string {
    return `Army join: ${this.mapName} [${this.cellName}:${this.padName}]`;
  }
}
