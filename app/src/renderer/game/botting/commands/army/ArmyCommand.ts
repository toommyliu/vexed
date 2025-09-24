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
        // console.log("All players have completed the action");
        // ipcRenderer.removeListener(IPC_EVENTS.ARMY_READY, listener);
        this.isListenerRegistered = false;
        this.allDone = true;
        resolve();
      };

      // console.log("Registering listener for army ready");
      // ipcRenderer.on(IPC_EVENTS.ARMY_READY, listener);
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
    // console.log("Executing army command");

    const allReadyPromise = this.setupArmyReadyListener();

    // Wait for listener registration
    while (!this.isListenerRegistered) {
      await this.bot.sleep(100);
    }

    // Execute the action
    await action();

    await this.sendDone();

    // Wait for all players
    // console.log("Waiting for all players to finish...");
    await allReadyPromise;
    // console.log("All players have finished");
  }

  /**
   * Notifies to other players in the group that this player has completed their action
   */
  public async sendDone(): Promise<void> {
    if (this.isDone) return;
    // We make sure to set this.isDone to true so that
    // we don't try and call armyFinishJob multiple times
    this.isDone = true;

    // console.log("Sending done notification...");
    await client.army.finishJob();
    // console.log("Done notification sent...");
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

  private checkForAbort() {
    return this.ctx.isRunning();
  }
}
