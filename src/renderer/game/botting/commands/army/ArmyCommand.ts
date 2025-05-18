import { ipcRenderer } from "../../../../../common/ipc";
import { IPC_EVENTS } from "../../../../../common/ipc-events";
import { Command } from "../../command";

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
      const listener = () => {
        console.log("All players have completed the action");
        // ipcRenderer.removeListener(IPC_EVENTS.ARMY_READY, listener);
        this.isListenerRegistered = false;
        this.allDone = true;
        resolve();
      };

      console.log("Registering listener for army ready");
      // ipcRenderer.on(IPC_EVENTS.ARMY_READY, listener);
      ipcRenderer.once(IPC_EVENTS.ARMY_READY, listener);
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
    console.log("Executing army command");

    const allReadyPromise = this.setupArmyReadyListener();

    // Wait for listener registration
    while (!this.isListenerRegistered) {
      await this.bot.sleep(100);
    }

    // Execute the action
    await action();

    await this.sendDone();

    // Wait for all players
    console.log("Waiting for all players to finish...");
    await allReadyPromise;
    console.log("All players have finished");
  }

  /**
   * Notifies to other players in the group that this player has completed their action
   */
  public async sendDone(): Promise<void> {
    if (this.isDone) return;

    console.log("Sending done notification...");
    await ipcRenderer.callMain(IPC_EVENTS.ARMY_FINISH_JOB);
    console.log("Done notification sent...");
    this.isDone = true;
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
