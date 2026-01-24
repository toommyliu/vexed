import type { Command } from "../botting/command";

type Position = {
  height?: string;
  left: string;
  top: string;
  visible: boolean;
  width?: string;
};

export type CommandItem = {
  index: string;
  text: string;
};

export function initCommandOverlayState() {
  const storageKey = "command-overlay-position";

  let lastCommands = $state<CommandItem[]>([]);
  let lastIndex = $state(-1);
  let listVisible = $state(true);
  let isDragging = $state(false);
  let isVisible = $state(false);

  let dragOffset = { x: 0, y: 0 };
  let updateThrottleId: number | null = null;

  const commandItems = $derived(lastCommands);
  const commandCount = $derived(lastCommands.length);
  const headerText = $derived(`Commands (${commandCount})`);
  const toggleButtonText = $derived(listVisible ? "▼" : "▶");

  /**
   * Updates the command list and current index.
   *
   * @param commands - The new list of commands.
   * @param currentIndex - The index of the currently selected command.
   * @returns True if the command list was updated, false otherwise.
   */
  function updateCommands(commands: Command[], currentIndex: number): boolean {
    const newItems: CommandItem[] = commands.map((cmd, index) => ({
      index: `[${index + 1}]`,
      text: cmd.toString(),
    }));

    if (
      lastIndex === currentIndex &&
      lastCommands.length === newItems.length &&
      lastCommands.every(
        (cmd, idx) =>
          cmd.index === newItems[idx]?.index &&
          cmd.text === newItems[idx]?.text,
      )
    ) {
      return false;
    }

    lastCommands = newItems;
    lastIndex = currentIndex;
    return true;
  }

  function toggleListVisibility(): void {
    listVisible = !listVisible;
  }

  function show(): void {
    isVisible = true;
  }

  function hide(): void {
    isVisible = false;
  }

  function toggle(): void {
    isVisible = !isVisible;
  }

  function setDragging(dragging: boolean): void {
    isDragging = dragging;
  }

  function savePosition(overlay: HTMLDivElement): void {
    const computed = window.getComputedStyle(overlay);
    const left = overlay.style.left || computed.left;
    const top = overlay.style.top || computed.top;

    if (!left || !top || left === "auto" || top === "auto") {
      return;
    }

    const position: Position = {
      left,
      top,
      visible: listVisible,
    };

    if (listVisible) {
      position.width = overlay.style.width || computed.width;
      position.height = overlay.style.height || computed.height;
    }

    localStorage.setItem(storageKey, JSON.stringify(position));
  }

  function loadPosition(overlay: HTMLDivElement): void {
    const savedPosition = localStorage.getItem(storageKey);

    if (!savedPosition) {
      const topNav = document.querySelector("#topnav-container");
      const topNavBottom = topNav?.getBoundingClientRect().bottom ?? 0;
      const minTop = Math.max(0, Math.round(topNavBottom));
      overlay.style.left = "20px";
      overlay.style.top = `${minTop}px`;
      return;
    }

    const position = JSON.parse(savedPosition) as Position;

    if (position.left && position.top) {
      overlay.style.left = position.left;
      overlay.style.top = position.top;
    } else {
      const topNav = document.querySelector("#topnav-container");
      const topNavBottom = topNav?.getBoundingClientRect().bottom ?? 0;
      const minTop = Math.max(0, Math.round(topNavBottom));
      overlay.style.left = "20px";
      overlay.style.top = `${minTop}px`;
    }

    if (position.visible !== undefined) {
      listVisible = position.visible;

      if (position.width && position.height && listVisible) {
        overlay.style.width = position.width;
        overlay.style.height = position.height;
      }
    }
  }

  return {
    get lastCommands() {
      return lastCommands;
    },
    get lastIndex() {
      return lastIndex;
    },
    get listVisible() {
      return listVisible;
    },
    get isDragging() {
      return isDragging;
    },
    get isVisible() {
      return isVisible;
    },
    get commandItems() {
      return commandItems;
    },
    get commandCount() {
      return commandCount;
    },
    get headerText() {
      return headerText;
    },
    get toggleButtonText() {
      return toggleButtonText;
    },
    get dragOffset() {
      return dragOffset;
    },
    set dragOffset(value) {
      dragOffset = value;
    },
    get updateThrottleId() {
      return updateThrottleId;
    },
    set updateThrottleId(value) {
      updateThrottleId = value;
    },
    updateCommands,
    toggleListVisibility,
    show,
    hide,
    toggle,
    setDragging,
    savePosition,
    loadPosition,
  };
}

export const commandOverlayState = initCommandOverlayState();