import { Command } from "../../command";

const getRandInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export class CommandArmyJoin extends Command {
  public mapName!: string;

  public cellName!: string;

  public padName!: string;

  private async afkHandler() {
    console.log("anti-afk triggered");
    this.bot.player.walkTo(getRandInt(150, 700), getRandInt(320, 450));
    await this.bot.sleep(5_000);
  }

  public override async execute() {
    const fn_afk = this.afkHandler.bind(this);

    const cleanup = () => this.bot.off("afk", fn_afk);

    this.bot.on("afk", fn_afk);
    this.ctx.once("end", cleanup);

    await this.bot.world.join(this.mapName, this.cellName, this.padName);
    await this.bot.army.waitForAll();

    cleanup();
    this.ctx.off("end", cleanup);
  }

  public override toString() {
    return `Army join: ${this.mapName} [${this.cellName}:${this.padName}]`;
  }
}
