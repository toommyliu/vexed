import { interval } from "@vexed/utils";
import type { KillOptions } from "../../../lib/Combat";
import { ArmyCommand } from "./ArmyCommand";

export class CommandArmyKill extends ArmyCommand {
  public targetName!: string;

  public itemName?: string;

  public qty?: number;

  public isTemp = false;

  public options!: Partial<KillOptions>;

  public override async executeImpl() {
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
            }
          }
        }, 100);
      }

      while (
        this.ctx.isRunning() &&
        !this.allDone &&
        !abortController.signal.aborted
      ) {
        if (this.allDone) {
          break;
        }

        await this.bot.combat.kill(this.targetName, {
          ...this.options,
          signal: abortController.signal,
        });

        // If no item checking is needed, mark as done after killing
        if (!this.isDone && (!this.itemName || !this.qty)) {
          void this.sendDone();
        }

        if (this.allDone) {
          break;
        }
      }

      stopFn?.();
    });
  }

  public override toString() {
    if (!this.itemName) {
      return `Army kill: ${this.targetName}`;
    }

    return `Army kill for ${this.isTemp ? "temp item" : "item"}: ${this.itemName} (${this.qty})`;
  }
}
