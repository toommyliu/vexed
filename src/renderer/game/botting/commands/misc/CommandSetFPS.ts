import { Command } from "../../command";

export class CommandSetFPS extends Command {
  public fps!: number;

  public override execute() {
    this.bot.settings.setFps(this.fps);
  }

  public override toString() {
    return `Set FPS: ${this.fps}`;
  }
}
