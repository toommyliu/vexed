import { Command } from "../../command";

const getRandInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export class CommandArmyWaitForArmy extends Command {
  // TODO: remove?
  public map?: string;

  public cell?: string;

  public pad?: string;

  public override async execute() {
    const fn = this.afkHandler.bind(this);
    this.bot.on("afk", fn);

    console.log("players:", this.bot.army.players);

    if (this.map) {
      await this.bot.world.join(this.map, this.cell, this.pad);
    }

    while (this.ctx.isRunning()) {
      const allInMap = Array.from(this.bot.army.players).every((player) =>
        this.bot.world.isPlayerInMap(player),
      );

      if (allInMap) {
        console.log("all players in map");
        break;
      }

      console.log(
        `tick, not in map: ${Array.from(this.bot.army.players).filter((player) => !this.bot.world.isPlayerInMap(player))}`,
      );

      await this.bot.sleep(1_000);
    }

    // TODO: better way to remove handlers when ctx is stopped
    this.bot.off("afk", fn);
  }

  private async afkHandler() {
    console.log("anti-afk triggered");
    this.bot.player.walkTo(getRandInt(150, 700), getRandInt(320, 450));
    await this.bot.sleep(5_000);
  }

  public override toString() {
    // return `Wait for army: ${this.map ?? ""}${this.cell ? ` [${this.cell}${this.pad ?? ""}]` : ""}`;
    return "Wait for army";
  }
}
