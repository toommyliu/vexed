import { ArmyCommand } from "./ArmyCommand";

export class CommandArmyJoin extends ArmyCommand {
  public mapName!: string;

  public cellName?: string;

  public padName?: string;

  public override async executeImpl() {
    await this.executeWithArmy(async () => {
      // mapName-roomNumber

      const split = this.mapName.split("-");
      const mapName = split[0];
      const roomNumber = split[1] ?? this.bot.army.roomNumber;
      const mapNameStr = `${mapName}-${roomNumber}`;

      // Some instances where join() is executed but the player just died
      while (
        this.ctx.isRunning() &&
        this.bot.world.name.toLowerCase() !== mapName!.toLowerCase()
      ) {
        await this.bot.world.join(mapNameStr, this.cellName, this.padName);
      }
    });
  }

  public override toString(): string {
    const split = this.mapName.split("-");
    const mapName = split[0];
    const roomNumber = split[1] ?? this.bot.army.roomNumber;
    const fullMapName = `${mapName}-${roomNumber}`;

    return `Army join: ${fullMapName} ${this.cellName ? `[${this.cellName}${this.padName ? `:${this.padName}` : ""}]` : ""}`;
  }
}
