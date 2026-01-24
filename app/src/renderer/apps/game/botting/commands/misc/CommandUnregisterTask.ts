import { Command } from "../../command";

export class CommandUnregisterTask extends Command {
  public name!: string;

  public override async executeImpl() {
    this.ctx.unregisterTask(this.name);
  }

  public override toString() {
    return `Unregister task: ${this.name}`;
  }
}
