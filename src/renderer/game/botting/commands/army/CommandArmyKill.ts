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
    await this.executeWithArmy(
      async () =>
        new Promise<void>((resolve) => {
          void interval(async (_, stop) => {
            if (this.allDone) {
              // console.log("allDone: stopping");
              resolve();
              stop();
              return;
            }

            // Not marked as done and item checking is required
            if (!this.isDone && this.itemName && this.qty) {
              // Match item quantity
              const done = this.isTemp
                ? this.bot.tempInventory.contains(this.itemName, this.qty)
                : this.bot.inventory.contains(this.itemName, this.qty);

              if (done) {
                void this.sendDone();
                // console.log("(2) this player is done");
                return;
              }
            }

            await this.bot.combat.kill(this.targetName, this.options);

            // If no item checking is needed, mark as done after killing
            if (!this.isDone && (!this.itemName || !this.qty)) {
              void this.sendDone();
              // console.log("(1) this player is done");
            }
          }, 150);
        }),
    );
  }

  public override toString() {
    if (!this.itemName) {
      return `Army kill: ${this.targetName}`;
    }

    return `Army kill for ${this.isTemp ? "temp item" : "item"}: ${this.itemName} (${this.qty})`;
  }
}
