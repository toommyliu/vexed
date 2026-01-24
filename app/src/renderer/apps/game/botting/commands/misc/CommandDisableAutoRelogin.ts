import { autoReloginState } from "../../../state/auto-relogin.svelte";
import { Command } from "../../command";

export class CommandDisableAutoRelogin extends Command {
  protected override _skipDelay = true;

  public override async executeImpl() {
    autoReloginState.disable();
  }

  public override toString() {
    return "Disable AutoRelogin";
  }
}
