import { interval } from "../../../../../shared/interval";
import type { KillOptions } from "../../../lib/Combat";
import { ArmyCommand } from "./ArmyCommand";

export class CommandArmyKill extends ArmyCommand {
  public targetName!: string;

  public itemName?: string;

  public qty?: number;

  public isTemp = false;

  public options!: Partial<KillOptions>;

  public override async execute() {
    const abortController = new AbortController();

    await this.executeWithArmy(async () => {
      let stopFn: (() => void) | undefined;

      if (this.itemName && this.qty) {
        void interval(async (_, stop) => {
          stopFn ??= stop;

          if (!this.ctx.isRunning()) {
            stop();
            return;
          }

          // Immediately abort and stop if all players are done
          if (this.allDone) {
            abortController.abort();
            stop();
            return;
          }

          // Check for item quantity if the player isn't done yet
          if (!this.isDone) {
            const done = this.isTemp
              ? this.bot.tempInventory.contains(this.itemName!, this.qty!)
              : this.bot.inventory.contains(this.itemName!, this.qty!);

            if (done) {
              void this.sendDone();
              console.log("(2) this player is done - quantity check thread");
              // Don't stop the interval yet, keep checking if allDone becomes true
            }
          }
        }, 100);
      }

      while (
        this.ctx.isRunning() &&
        !this.allDone &&
        !abortController.signal.aborted
      ) {
        // Double-check allDone status before starting a new kill
        if (this.allDone) {
          console.log("All players are done, breaking out of kill loop");
          break;
        }

        console.log("Looks like we need to help with a kill...");
        await this.bot.combat.kill(this.targetName, {
          ...this.options,
          signal: abortController.signal,
        });

        // If no item checking is needed, mark as done after killing
        if (!this.isDone && (!this.itemName || !this.qty)) {
          void this.sendDone();
          console.log("(1) this player is done");
        }

        // Check if all players are done after each kill
        if (this.allDone) {
          console.log("All players are done after kill, breaking");
          break;
        }
      }

      console.log(
        "Looks like we are done with the kill command for this player.",
      );
      if (stopFn) {
        stopFn();
      }
    });
  }

  public override toString() {
    if (!this.itemName) {
      return `Army kill: ${this.targetName}`;
    }

    return `Army kill for ${this.isTemp ? "temp item" : "item"}: ${this.itemName} (${this.qty})`;
  }
}
