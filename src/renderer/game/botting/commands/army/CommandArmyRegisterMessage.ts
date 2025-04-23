import { Command } from "../../command";

export class CommandArmyRegisterMessage extends Command {
  public message!: string;

  public override execute() {
    this.bot.army.registerMessage(this.message);
  }

  public override toString() {
    return `Register message: ${this.message}`;
  }
}
