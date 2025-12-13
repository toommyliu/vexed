import { SvelteMap } from "svelte/reactivity";
import type { Command } from "./botting/command";
import type { SkillSet } from "./util/skillParser";

function initState() {
  let infiniteRange = $state(false);
  let provokeCell = $state(false);
  let enemyMagnet = $state(false);
  let lagKiller = $state(false);
  let hidePlayers = $state(false);
  let skipCutscenes = $state(false);
  let disableFx = $state(false);
  let disableCollisions = $state(false);
  let walkSpeed = $state(8);
  let fps = $state(24);

  return {
    get infiniteRange() {
      return infiniteRange;
    },
    set infiniteRange(value) {
      infiniteRange = value;
    },
    get provokeCell() {
      return provokeCell;
    },
    set provokeCell(value) {
      provokeCell = value;
    },
    get enemyMagnet() {
      return enemyMagnet;
    },
    set enemyMagnet(value) {
      enemyMagnet = value;
    },
    get lagKiller() {
      return lagKiller;
    },
    set lagKiller(value) {
      lagKiller = value;
    },
    get hidePlayers() {
      return hidePlayers;
    },
    set hidePlayers(value) {
      hidePlayers = value;
    },
    get skipCutscenes() {
      return skipCutscenes;
    },
    set skipCutscenes(value) {
      skipCutscenes = value;
    },
    get disableFx() {
      return disableFx;
    },
    set disableFx(value) {
      disableFx = value;
    },
    get disableCollisions() {
      return disableCollisions;
    },
    set disableCollisions(value) {
      disableCollisions = value;
    },
    get walkSpeed() {
      return walkSpeed;
    },
    set walkSpeed(value) {
      walkSpeed = value;
    },
    get fps() {
      return fps;
    },
    set fps(value) {
      fps = value;
      if (typeof value === "number") {
        try {
          swf.settingsSetFPS(value);
        } catch { }
      }
    },
  };
}

function initScriptState() {
  let isRunning = $state(false);
  let isLoaded = $state(false);
  let showOverlay = $state(false);

  return {
    get isRunning() {
      return isRunning;
    },
    set isRunning(value) {
      isRunning = value;
    },
    get isLoaded() {
      return isLoaded;
    },
    set isLoaded(value) {
      isLoaded = value;
    },
    get showOverlay() {
      return showOverlay;
    },
    set showOverlay(value) {
      showOverlay = value;
    },
  };
}

function initAppState() {
  // Whether the game has loaded.
  let gameLoaded = $state(false);
  let skillSets = $state(new SvelteMap<string, SkillSet>());

  return {
    get gameLoaded() {
      return gameLoaded;
    },
    set gameLoaded(value) {
      gameLoaded = value;
    },
    get skillSets() {
      return skillSets;
    },
    set skillSets(value) {
      skillSets = value;
    },
  };
}

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
        (cmd, i) => cmd.index === newItems[i]?.index && cmd.text === newItems[i]?.text
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

    if (!left || !top || left === 'auto' || top === 'auto') {
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
      const topNav = document.getElementById("topnav-container");
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
      const topNav = document.getElementById("topnav-container");
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

export const gameState = initState();
export const scriptState = initScriptState();
export const appState = initAppState();
export const commandOverlayState = initCommandOverlayState();
