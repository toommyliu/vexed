import { Command } from "~/botting/command";
import { autoReloginState } from "~/game/state.svelte";

export class CommandDisableAutoRelogin extends Command {
  protected override _skipDelay = true;

  public override async executeImpl() {
    autoReloginState.disable();
  }

  public override toString() {
    return "Disable AutoRelogin";
  }
}
