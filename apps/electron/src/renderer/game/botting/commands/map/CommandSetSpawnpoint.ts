import { Command } from "@botting/command";

export class CommandSetSpawnpoint extends Command {
  public cell?: string;

  public pad?: string;

  public override execute() {
    this.bot.world.setSpawnPoint(this.cell, this.pad);
  }

  public override toString() {
    return `Set spawnpoint${this.cell ? `: ${this.cell}${this.pad ? `:${this.pad}` : ""}` : ""}`;
  }
}
