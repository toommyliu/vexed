import { Command } from "~/botting/command";

export class CommandSetFPS extends Command {
  public fps!: number;

  public override executeImpl() {
    this.bot.settings.setFps(this.fps);
  }

  public override toString() {
    return `Set FPS: ${this.fps}`;
  }
}
