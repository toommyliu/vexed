import { Command } from "~/botting/command";

export class CommandRegisterTask extends Command {
  public name!: string;

  public taskFn!: () => Promise<void>;

  public override async executeImpl() {
    this.ctx.registerTask(this.name, this.taskFn);
    void this.taskFn();
  }

  public override toString() {
    return `Register task: ${this.name}`;
  }
}
