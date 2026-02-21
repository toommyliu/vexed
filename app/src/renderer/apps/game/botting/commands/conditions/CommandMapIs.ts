import { ConditionCommand } from "./ConditionCommand";

export class CommandMapIs extends ConditionCommand {
  public map!: string;

  public override async getCondition(): Promise<boolean> {
    if (this.map.includes("-")) {
      const [map, room] = this.map.split("-");
      if (map && room) {
        return (
          this.bot.world.name.toLowerCase() === map.toLowerCase() &&
          this.bot.world.roomNumber === Number.parseInt(room, 10)
        );
      }
    }

    return this.bot.world.name.toLowerCase() === this.map.toLowerCase();
  }

  public override toString() {
    return `Map is: ${this.map}`;
  }
}
