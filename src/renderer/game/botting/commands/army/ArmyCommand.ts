import { ipcRenderer } from "../../../../../common/ipc";
import { IPC_EVENTS } from "../../../../../common/ipc-events";
import { Command } from "../../command";

export abstract class ArmyCommand extends Command {
  private registeredListener = false;

  protected async executeWithArmy(action: () => Promise<void>): Promise<void> {
    console.log("Executing army command");

    const allReadyPromise = new Promise<void>((resolve) => {
      const listener = () => {
        console.log("All players have completed the action");
        ipcRenderer.removeListener(IPC_EVENTS.ARMY_READY, listener);
        resolve();
      };

      console.log("Registered listener for army ready");
      ipcRenderer.on(IPC_EVENTS.ARMY_READY, listener);
      this.registeredListener = true;
    });

    // Call the action
    await action();

    while (!this.registeredListener) {
      await this.bot.sleep(100);
    }

    await ipcRenderer.callMain(IPC_EVENTS.ARMY_FINISH_JOB);
    console.log("Notified action completion, waiting for others...");

    // Wait until all players have completed the action
    await allReadyPromise;
  }
}
