import { ArmyCommand } from "./ArmyCommand";

export class CommandArmyJoin extends ArmyCommand {
  public mapName!: string;

  public cellName!: string;

  public padName!: string;

  public override async execute(): Promise<void> {
    await this.executeWithArmy(async () => {
      // mapName-roomNumber

      const split = this.mapName.split("-");
      const mapName = split[0];
      const roomNumber = split[1] ?? this.bot.army.roomNumber;
      const mapNameStr = `${mapName}-${roomNumber}`;

      console.log("mapNameStr", mapNameStr);

      await this.bot.world.join(mapNameStr, this.cellName, this.padName);
    });
  }

  public override toString(): string {
    return `Army join: ${this.mapName} [${this.cellName}:${this.padName}]`;
  }
}
