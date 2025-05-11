import { ipcRenderer } from "../../../common/ipc";
import { IPC_EVENTS } from "../../../common/ipc-events";
import { Logger } from "../../../common/logger";
import { disableElement, enableElement } from "../ui-utils";

const logger = Logger.get("FastTravels");

let roomNumber = 100_000;

window.addEventListener("DOMContentLoaded", async () => {
  const locations = await ipcRenderer
    .callMain(IPC_EVENTS.READ_FAST_TRAVELS)
    .catch(() => {
      logger.error("Failed to read fast travels list");
      return [];
    });

  const input = document.querySelector("#room-number") as HTMLInputElement;
  input.addEventListener("input", () => {
    const val = Number.parseInt(input.value, 10);

    if (Number.isNaN(val)) {
      roomNumber = 100_000;
      return;
    }

    // clamp between 1 and 100_000
    roomNumber = Math.max(1, Math.min(val, 100_000));
    input.value = roomNumber.toString();
  });

  const container = document.querySelector("#locations") as HTMLDivElement;

  for (const location of locations) {
    if (!location.map) continue;

    const div = document.createElement("div");

    const btn = document.createElement("button");
    btn.className =
      "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 p-2 rounded-md w-full transition-all duration-200 shadow-sm";
    btn.textContent = location.name;

    // eslint-disable-next-line @typescript-eslint/no-loop-func
    btn.addEventListener("click", async () => {
      logger.info(location);

      for (const el of container.querySelectorAll("button")) {
        disableElement(el);
      }

      await ipcRenderer.callMain(IPC_EVENTS.MSGBROKER, {
        data: { ...location, roomNumber },
        ipcEvent: IPC_EVENTS.FAST_TRAVEL,
      });

      for (const el of container.querySelectorAll("button")) {
        enableElement(el);
      }
    });

    div.append(btn);
    container.append(div);
  }
});
