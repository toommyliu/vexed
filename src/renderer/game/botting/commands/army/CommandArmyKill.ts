import { interval } from "../../../../../common/interval";
import { ArmyCommand } from "./ArmyCommand";

export class CommandArmyKill extends ArmyCommand {
  public targetName!: string;

  public itemName!: string;

  public qty!: number;

  public isTemp = false;

  public override async execute() {
    await this.executeWithArmy(
      async () =>
        new Promise<void>((resolve) => {
          void interval(async (_, stop) => {
            if (this.allDone) {
              console.log("allDone: stopping");
              resolve();
              stop();
              return;
            }

            await this.bot.combat.kill(this.targetName);

            if (!this.isDone) {
              const done = this.isTemp
                ? this.bot.tempInventory.contains(this.itemName, this.qty)
                : this.bot.inventory.contains(this.itemName, this.qty);

              if (done) {
                await this.sendDone();
                console.log("this player is done");
              }
            }
          }, 150);
        }),
    );
  }

  public override toString() {
    return `Army kill for ${this.isTemp ? "temp item" : "item:"} ${this.itemName} (${this.qty})`;
  }
}
