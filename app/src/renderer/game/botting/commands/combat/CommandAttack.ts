import { Command } from "@botting/command";

export class CommandAttack extends Command {
  public target!: string;

  public override executeImpl() {
    this.bot.combat.attack(this.target);
  }

  public override toString() {
    return `Attack: ${this.target}`;
  }
}
