import process from "process";
import { WINDOW_IDS } from "../../common/constants";
import { ipcRenderer } from "../../common/ipc";
import { IPC_EVENTS } from "../../common/ipc-events";
import { startAutoAggro, stopAutoAggro } from "./autoaggro";
import { Bot } from "./lib/Bot";
import { enableElement } from "./ui-utils";
import { createToggleCheckbox } from "./util/createToggleCheckbox";

const bot = Bot.getInstance();
const dropdowns = new Map<string, HTMLElement>();

const DEFAULT_PADS = [
  "Center",
  "Spawn",
  "Left",
  "Right",
  "Top",
  "Bottom",
  "Up",
  "Down",
] as const;

ipcRenderer.answerMain(IPC_EVENTS.SCRIPT_LOADED, (args) => {
  {
    const btn = document.querySelector(
      "#scripts-dropdowncontent > button:nth-child(2)",
    ) as HTMLButtonElement;

    enableElement(btn);

    btn.textContent = "Start";

    if (
      args?.fromManager &&
      window.context.commands.length > 0 &&
      !window.context.isRunning()
    ) {
      const onEnd = () => {
        btn.textContent = "Start";
        window.context.removeListener("end", onEnd);
      };

      window.context.on("end", onEnd);
      void window.context.start();
      btn.textContent = "Stop";
    }
  }

  window.context.overlay.updateCommands(
    window.context.commands,
    window.context.commandIndex,
  );
  window.context.overlay.show();
});

window.addEventListener("DOMContentLoaded", async () => {
  dropdowns.set("scripts", document.querySelector("#scripts-dropdowncontent")!);
  dropdowns.set("tools", document.querySelector("#tools-dropdowncontent")!);
  dropdowns.set("packets", document.querySelector("#packets-dropdowncontent")!);
  dropdowns.set("options", document.querySelector("#options-dropdowncontent")!);
  dropdowns.set(
    "autoaggro",
    document.querySelector("#autoaggro-dropdowncontent")!,
  );
  dropdowns.set("pads", document.querySelector("#pads-dropdowncontent")!);
  dropdowns.set("cells", document.querySelector("#cells-dropdowncontent")!);

  {
    const btn = document.querySelector(
      "#scripts-dropdowncontent > button:nth-child(1)",
    ) as HTMLButtonElement;
    btn.addEventListener("click", () => {
      void ipcRenderer.callMain(IPC_EVENTS.LOAD_SCRIPT, {});
    });

    document.addEventListener("keydown", (ev) => {
      if (ev.key === "PageUp") {
        ev.preventDefault();
        void ipcRenderer.callMain(IPC_EVENTS.LOAD_SCRIPT, {});
      }
    });
  }

  {
    const btn = document.querySelector(
      "#scripts-dropdowncontent > button:nth-child(2)",
    ) as HTMLButtonElement;

    const onEnd = () => {
      btn.textContent = "Start";
      window.context.removeListener("end", onEnd);
    };

    const toggleScript = () => {
      if (window.context.isRunning()) {
        void window.context.stop();
        btn.textContent = "Start";
      } else {
        if (!window.context.commands.length) return;

        window.context.on("end", onEnd);

        void window.context.start();
        btn.textContent = "Stop";
      }
    };

    btn.addEventListener("click", toggleScript);

    document.addEventListener("keydown", (ev) => {
      if (ev.key === "PageDown") {
        ev.preventDefault();
        toggleScript();
      }
    });
  }

  {
    const btn = document.querySelector(
      "#scripts-dropdowncontent > button:nth-child(3)",
    ) as HTMLButtonElement;

    const label = btn.querySelector("span") as HTMLSpanElement;

    createToggleCheckbox(
      btn,
      () => {
        window.context.overlay.toggle();
      },
      false,
    );

    window.context.overlay.on("display", (visible) => {
      btn.dataset["state"] = visible.toString();
      label.textContent = visible ? "Hide Overlay" : "Show Overlay";
      if (visible) {
        btn.classList.add("option-active");
      } else {
        btn.classList.remove("option-active");
      }
    });

    window.context.on("start", () => {
      btn.dataset["state"] = "true";
      btn.classList.add("option-active");
    });

    window.context.on("end", () => {
      btn.dataset["state"] = "false";
      btn.classList.remove("option-active");
    });
  }

  {
    const btn = document.querySelector(
      "#scripts-dropdowncontent > button:nth-child(4)",
    ) as HTMLButtonElement;
    btn.addEventListener("click", () => {
      void ipcRenderer.callMain(IPC_EVENTS.TOGGLE_DEV_TOOLS);
    });
  }

  {
    const btn = document.querySelector(
      "#tools-dropdowncontent > button:nth-child(1)",
    ) as HTMLButtonElement;
    btn.addEventListener("click", () => {
      void ipcRenderer.callMain(IPC_EVENTS.ACTIVATE_WINDOW, {
        windowId: WINDOW_IDS.FAST_TRAVELS,
      });
    });
  }

  {
    const btn = document.querySelector(
      "#tools-dropdowncontent > button:nth-child(2)",
    ) as HTMLButtonElement;
    btn.addEventListener("click", () => {
      void ipcRenderer.callMain(IPC_EVENTS.ACTIVATE_WINDOW, {
        windowId: WINDOW_IDS.LOADER_GRABBER,
      });
    });
  }

  {
    const btn = document.querySelector(
      "#tools-dropdowncontent > button:nth-child(3)",
    ) as HTMLButtonElement;
    btn.addEventListener("click", () => {
      void ipcRenderer.callMain(IPC_EVENTS.ACTIVATE_WINDOW, {
        windowId: WINDOW_IDS.FOLLOWER,
      });
    });
  }

  {
    const btn = document.querySelector(
      "#packets-dropdowncontent > button:nth-child(1)",
    ) as HTMLButtonElement;
    btn.addEventListener("click", () => {
      void ipcRenderer.callMain(IPC_EVENTS.ACTIVATE_WINDOW, {
        windowId: WINDOW_IDS.PACKETS_LOGGER,
      });
    });
  }

  {
    const btn = document.querySelector(
      "#packets-dropdowncontent > button:nth-child(2)",
    ) as HTMLButtonElement;
    btn.addEventListener("click", () => {
      void ipcRenderer.callMain(IPC_EVENTS.ACTIVATE_WINDOW, {
        windowId: WINDOW_IDS.PACKETS_SPAMMER,
      });
    });
  }

  {
    const btn = document.querySelector(
      "#autoaggro-dropdowncontent > button:nth-child(1)",
    ) as HTMLButtonElement;

    createToggleCheckbox(btn, (on) => {
      if (on) {
        startAutoAggro();
      } else {
        stopAutoAggro();
      }
    });
  }

  {
    let lastRoomId: number | null = null;

    const cellsBtn = document.querySelector("#cells") as HTMLButtonElement;
    const cellsDropdown = document.querySelector(
      "#cells-dropdowncontent",
    ) as HTMLDivElement;

    const padsBtn = document.querySelector("#pads") as HTMLButtonElement;
    const padsDropdown = document.querySelector(
      "#pads-dropdowncontent",
    ) as HTMLDivElement;

    const updateCellsDropdown = () => {
      if (!bot.player.isReady() || bot.world.roomId === lastRoomId) return;

      cellsDropdown.innerHTML = "";
      const fragment = document.createDocumentFragment();

      // TODO: if we change rooms, we need to update the current cell display as needed

      for (const cell of bot.world.cells) {
        const cellBtn = document.createElement("button");
        cellBtn.className =
          "px-4 py-2 text-xs block w-full text-left hover:bg-gray-700";
        cellBtn.textContent = cell;
        cellBtn.addEventListener("click", () => {
          if (!bot.player.isReady()) return;

          bot.flash.call(() => swf.playerJump(cell, bot.player.pad ?? "Spawn"));
          cellsBtn.innerHTML = `<span>${cell}</span>`;
        });
        fragment.append(cellBtn);
      }

      cellsDropdown.append(fragment);
      lastRoomId = bot.world.roomId;
    };

    const updatePadsDropdown = () => {
      if (!bot.player.isReady()) return;

      padsDropdown.innerHTML = "";
      const fragment = document.createDocumentFragment();

      for (const pad of DEFAULT_PADS) {
        const padBtn = document.createElement("button");
        padBtn.className =
          "px-4 py-2 text-xs block w-full text-left hover:bg-gray-700";

        // Highlight valid cell pads
        if (bot.world.cellPads.includes(pad)) {
          padBtn.classList.add("text-green-500");
        }

        padBtn.textContent = pad;
        padBtn.addEventListener("click", () => {
          if (!bot.player.isReady()) return;

          bot.flash.call(() => swf.playerJump(bot.player.cell ?? "Enter", pad));
          padsBtn.innerHTML = `<span>${pad}</span>`;
        });
        fragment.append(padBtn);
      }

      padsDropdown.append(fragment);
    };

    cellsBtn.addEventListener("click", (ev) => {
      if (!bot.player.isReady()) return;

      updateCellsDropdown();

      padsDropdown.classList.add("hidden");
      cellsDropdown.classList.toggle("hidden");

      ev.stopPropagation();
    });

    padsBtn.addEventListener("click", (ev) => {
      if (!bot.player.isReady()) return;

      updatePadsDropdown();

      cellsDropdown.classList.add("hidden");
      padsDropdown.classList.toggle("hidden");

      ev.stopPropagation();
    });

    const xBtn = document.querySelector("#x") as HTMLButtonElement;
    xBtn.addEventListener("click", () => {
      if (!bot.player.isReady()) return;

      updateCellsDropdown();
      updatePadsDropdown();

      const currentCell = bot.player.cell ?? "Enter";
      const currentPad = bot.player.pad ?? "Spawn";

      cellsBtn.innerHTML = `<span>${currentCell}</span>`;
      padsBtn.innerHTML = `<span>${currentPad}</span>`;

      bot.flash.call(() => swf.playerJump(currentCell, currentPad));
    });
  }

  {
    const btn = document.querySelector("#bank") as HTMLButtonElement;
    btn.addEventListener("click", async () => {
      if (!bot.player.isReady()) return;

      if (bot.bank.isOpen()) {
        bot.flash.call(() => swf.bankOpen());
      } else {
        await bot.bank.open();
      }
    });
  }

  {
    const options =
      document.querySelectorAll<HTMLButtonElement>('[id^="option-"]');
    for (const option of options) {
      if (option.id === "option-walkspeed") {
        const _option = option.querySelector("input") as HTMLInputElement;

        const handleWalkSpeed = (event: Event) => {
          const value = Number.parseInt(_option.value, 10);

          const newWalkSpeed = Number.isNaN(value)
            ? 8 // default 8
            : Math.max(0, Math.min(99, value)); // clamp between 0 and 99

          _option.value = newWalkSpeed.toString();

          if (event.type === "change") bot.settings.walkSpeed = newWalkSpeed;
        };

        _option.addEventListener("input", handleWalkSpeed);
        _option.addEventListener("change", handleWalkSpeed);
      } else {
        createToggleCheckbox(option, (on) => {
          switch (option.id) {
            case "option-infinite-range":
              bot.settings.infiniteRange = on;
              break;
            case "option-provoke-map":
              bot.settings.provokeMap = on;
              break;
            case "option-provoke-cell":
              bot.settings.provokeCell = on;
              break;
            case "option-enemy-magnet":
              bot.settings.enemyMagnet = on;
              break;
            case "option-lag-killer":
              bot.settings.lagKiller = on;
              break;
            case "option-hide-players":
              bot.settings.hidePlayers = on;
              break;
            case "option-skip-cutscenes":
              bot.settings.skipCutscenes = on;
              break;
            case "option-disable-fx":
              bot.settings.disableFx = on;
              break;
            case "option-disable-collisions":
              bot.settings.disableCollisions = on;
              break;
          }
        });
      }
    }
  }
});

window.addEventListener("click", (ev) => {
  const target = ev.target as HTMLElement;
  const optionsDropdown = document.querySelector("#options-dropdowncontent");

  for (const [key, el] of dropdowns.entries()) {
    try {
      if (target.id === key) {
        // Toggle the dropdown
        el.classList.toggle("hidden");
      } else if (
        // Preserve dropdown state if:
        // - Clicking option buttons within options menu
        // - Using walkspeed input
        target.id !== "option-walkspeed" &&
        !(
          optionsDropdown?.contains(target) && target.closest('[id^="option-"]')
        )
      ) {
        el.classList.add("hidden");
      }
    } catch {}
  }
});

// Close all dropdowns when focusing the game
window.addEventListener("mousedown", (ev) => {
  if ((ev.target as HTMLElement).id === "swf") {
    for (const el of dropdowns.values()) {
      el.classList.add("hidden");
    }
  }
});

// Allow certain shortcuts while the game is focused
window.addEventListener("keydown", (ev) => {
  const isMac = process.platform === "darwin";
  const isWindows = process.platform === "win32";

  if (
    ((isMac && ev.metaKey) /* cmd */ || (isWindows && ev.ctrlKey)) /* ctrl */ &&
    (ev.target as HTMLElement).id === "swf"
  ) {
    switch (ev.key.toLowerCase()) {
      case "w":
      case "q":
        window.close();
        break;
      case "r":
        if (ev.shiftKey) {
          window.location.reload();
        }

        break;
    }
  }
});
