import { Command } from "@botting/command";

export class CommandJoinMap extends Command {
  public map!: string;

  public cell = "Enter";

  public pad = "Spawn";

  public override async execute() {
    await this.bot.world.join(this.map, this.cell, this.pad);
  }

  public override toString() {
    return `Join: ${this.map} ${this.cell}:${this.pad}`;
  }
}
