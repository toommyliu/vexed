import { ipcRenderer } from "../../../../../common/ipc";
import { IPC_EVENTS } from "../../../../../common/ipc-events";
import { Command } from "../../command";

export class CommandArmyJoin extends Command {
  public mapName!: string;

  public cellName!: string;

  public padName!: string;

  public override async execute() {
    console.log("Army join command");

    const allJoinedPromise = new Promise<void>((resolve) => {
      const listener = () => {
        console.log("All players have joined");
        ipcRenderer.removeListener(IPC_EVENTS.ARMY_READY, listener);
        resolve();
      };

      console.log("Registered listener for army ready");
      ipcRenderer.on(IPC_EVENTS.ARMY_READY, listener);
    });

    await this.bot.world.join(this.mapName, this.cellName, this.padName);
    await this.bot.sleep(100);

    // Then notify join
    await ipcRenderer.callMain(IPC_EVENTS.ARMY_FINISH_JOB);
    console.log("Notified joined, waiting for others...");

    // Wait until all players have joined
    await allJoinedPromise;
  }

  public override toString() {
    return `Army join: ${this.mapName} [${this.cellName}:${this.padName}]`;
  }
}
