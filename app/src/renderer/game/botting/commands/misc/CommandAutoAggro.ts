import { Command } from "@botting/command";
import { startAutoAggro, stopAutoAggro } from "@game/autoaggro";

export class CommandAutoAggro extends Command {
  private static btn: HTMLButtonElement;

  public state!: boolean;

  public override async execute() {
    CommandAutoAggro.btn ??= document.querySelector(
      "#autoaggro-dropdowncontent > button:nth-child(1)",
    ) as HTMLButtonElement;
    CommandAutoAggro.btn.dataset["state"] = this.state.toString();
    CommandAutoAggro.btn.classList.toggle("option-active", Boolean(this.state));

    if (this.state) {
      startAutoAggro();
    } else {
      stopAutoAggro();
    }
  }

  public override toString() {
    return `${this.state ? "Start" : "Stop"} auto aggro`;
  }
}
