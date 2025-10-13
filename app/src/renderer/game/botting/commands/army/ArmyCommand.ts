import { Command } from "@botting/command";
import { client, handlers } from "@shared/tipc";

export abstract class ArmyCommand extends Command {
  private isListenerRegistered = false;

  private armyReadyPromise: Promise<void> | null = null;

  /**
   * Whether all players have completed the action.
   */
  public allDone = false;

  /**
   * Whether this player has completed the action.
   */
  public isDone = false;

  /**
   * Sets up a listener for army ready events
   */
  private async setupArmyReadyListener(): Promise<void> {
    if (this.armyReadyPromise) {
      return this.armyReadyPromise;
    }

    this.armyReadyPromise = new Promise<void>((resolve) => {
      const listener = async () => {
        this.isListenerRegistered = false;
        this.allDone = true;
        resolve();
      };

      handlers.army.armyReady.handle(listener);
      this.isListenerRegistered = true;
    });

    return this.armyReadyPromise;
  }

  /**
   * Executes an action that requires coordination with the army
   *
   * @param action - The action to execute
   */
  protected async executeWithArmy(action: () => Promise<void>): Promise<void> {
    const allReadyPromise = this.setupArmyReadyListener();

    while (!this.isListenerRegistered) {
      await this.bot.sleep(100);
    }

    await action();
    await this.sendDone();
    await allReadyPromise;
  }

  /**
   * Notifies to other players in the group that this player has completed their action
   */
  public async sendDone(): Promise<void> {
    if (this.isDone) return;
   
    this.isDone = true;
    await client.army.finishJob();
  }

  /**
   * Waits for all players in the group to complete their action
   */
  public async waitForAll(): Promise<void> {
    if (!this.isListenerRegistered) {
      await this.setupArmyReadyListener();
    }

    await this.armyReadyPromise;
  }
}
