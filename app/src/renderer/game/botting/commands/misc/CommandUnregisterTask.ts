import { Command } from "@botting/command";

export class CommandUnregisterTask extends Command {
  public name!: string;

  public override async execute() {
    this.ctx.unregisterTask(this.name);
  }

  public override toString() {
    return `Unregister task: ${this.name}`;
  }
}
