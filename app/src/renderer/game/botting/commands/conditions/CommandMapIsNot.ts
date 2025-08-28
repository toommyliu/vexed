import { Command } from "@botting/command";

export class CommandMapIsNot extends Command {
  public map!: string;

  public override skipDelay = true;

  public override execute() {
    if (this.map.includes("-")) {
      const [map, room] = this.map.split("-");
      if (
        map &&
        room &&
        this.bot.world.name.toLowerCase() === map.toLowerCase() &&
        this.bot.world.roomNumber === Number.parseInt(room, 10)
      ) {
        this.ctx.commandIndex++;
      }
    } else if (this.bot.world.name.toLowerCase() === this.map.toLowerCase()) {
      this.ctx.commandIndex++;
    }
  }

  public override toString() {
    return `Map is not: ${this.map}`;
  }
}
