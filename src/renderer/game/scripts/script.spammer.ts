import { ipcRenderer } from "../../../common/ipc";
import { IPC_EVENTS } from "../../../common/ipc-events";
import { setElement } from "../ui-utils";

const packets: string[] = [];

let on = false;
let selectedLine: HTMLElement | null = null;

window.addEventListener("DOMContentLoaded", async () => {
  {
    const btn = document.querySelector("#clear") as HTMLButtonElement;
    btn.addEventListener("click", () => {
      document.querySelector("#spammer")!.innerHTML = "";
      packets.length = 0;
    });
  }

  {
    const spammer = document.querySelector("#spammer") as HTMLDivElement;
    const removeBtn = document.querySelector("#remove") as HTMLButtonElement;
    const addBtn = document.querySelector("#add") as HTMLButtonElement;

    addBtn.addEventListener("click", () => {
      const packet = (document.querySelector("#packet") as HTMLInputElement)
        .value;

      if (!packet.length) return;

      packets.push(packet);

      {
        const div = document.createElement("div");
        div.classList.add(
          "block",
          "w-max",
          "cursor-pointer",
          "text-white",
          "rounded",
          "text-sm",
          "m-1",
          "p-1",
        );
        div.innerHTML = packet;
        div.addEventListener("click", (ev) => {
          if (selectedLine) {
            selectedLine.classList.remove("bg-zinc-700");
          }

          if (ev.target === selectedLine) {
            selectedLine = null;
            setElement(removeBtn, false);
          } else {
            selectedLine = ev.target as HTMLElement;
            selectedLine.classList.add("bg-zinc-700");
            setElement(removeBtn, true);
          }
        });
        spammer.append(div);
      }

      spammer.scrollTo(0, spammer.scrollHeight);
    });

    removeBtn.addEventListener("click", () => {
      if (!selectedLine) return;

      const lineContent = selectedLine.innerHTML;
      selectedLine.remove();
      selectedLine = null;

      setElement(removeBtn, false);

      const index = packets.indexOf(lineContent);
      packets.splice(index, 1);
    });
  }

  {
    const stopBtn = document.querySelector("#stop") as HTMLButtonElement;
    const startBtn = document.querySelector("#start") as HTMLButtonElement;

    stopBtn.addEventListener("click", async () => {
      on = false;

      setElement(stopBtn, false);
      setElement(startBtn, true);

      await ipcRenderer
        .callMain(IPC_EVENTS.MSGBROKER, {
          ipcEvent: IPC_EVENTS.PACKET_SPAMMER_STOP,
        })
        .catch(() => {});
    });

    startBtn.addEventListener("click", async () => {
      on = true;

      setElement(stopBtn, true);
      setElement(startBtn, false);

      await ipcRenderer
        .callMain(IPC_EVENTS.MSGBROKER, {
          ipcEvent: IPC_EVENTS.PACKET_SPAMMER_START,
          data: {
            packets,
            delay:
              Number.parseInt(
                (document.querySelector("#delay") as HTMLInputElement).value,
                10,
              ) ?? 1_000,
          },
        })
        .catch(() => {});
    });
  }

  ipcRenderer.answerMain(IPC_EVENTS.REFRESHED, async () => {
    await ipcRenderer
      .callMain(IPC_EVENTS.MSGBROKER, {
        ipcEvent: IPC_EVENTS.PACKET_SPAMMER_STOP,
      })
      .catch(() => {});

    const stopBtn = document.querySelector("#stop") as HTMLButtonElement;
    const startBtn = document.querySelector("#start") as HTMLButtonElement;

    setElement(stopBtn, true);
    setElement(startBtn, false);
  });
});

window.addEventListener("beforeunload", async () => {
  if (on) {
    await ipcRenderer.callMain(IPC_EVENTS.MSGBROKER, {
      ipcEvent: IPC_EVENTS.PACKET_SPAMMER_STOP,
    });
  }
});
