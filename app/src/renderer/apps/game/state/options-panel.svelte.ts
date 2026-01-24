export function initOptionsPanelState() {
  const storageKey = "options-panel-position";

  type OptionsPanelPosition = {
    height?: string;
    left: string;
    top: string;
    width?: string;
  };

  let isVisible = $state(false);
  let isDragging = $state(false);
  let dragOffset = { x: 0, y: 0 };

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

  function savePosition(panel: HTMLDivElement): void {
    const computed = window.getComputedStyle(panel);
    const left = panel.style.left || computed.left;
    const top = panel.style.top || computed.top;

    if (!left || !top || left === "auto" || top === "auto") {
      return;
    }

    const position: OptionsPanelPosition = {
      left,
      top,
      width: panel.style.width || computed.width,
      height: panel.style.height || computed.height,
    };
    localStorage.setItem(storageKey, JSON.stringify(position));
  }

  function loadPosition(panel: HTMLDivElement): void {
    const savedPosition = localStorage.getItem(storageKey);

    if (!savedPosition) {
      const topNav = document.querySelector("#topnav-container");
      const topNavBottom = topNav?.getBoundingClientRect().bottom ?? 0;
      const minTop = Math.max(0, Math.round(topNavBottom));
      panel.style.left = "20px";
      panel.style.top = `${minTop}px`;
      return;
    }

    const position = JSON.parse(savedPosition) as OptionsPanelPosition;

    if (position.left && position.top) {
      panel.style.left = position.left;
      panel.style.top = position.top;
    } else {
      const topNav = document.querySelector("#topnav-container");
      const topNavBottom = topNav?.getBoundingClientRect().bottom ?? 0;
      const minTop = Math.max(0, Math.round(topNavBottom));
      panel.style.left = "20px";
      panel.style.top = `${minTop}px`;
    }

    if (position.width) {
      panel.style.width = position.width;
    }
    if (position.height) {
      panel.style.height = position.height;
    }
  }

  return {
    get isVisible() {
      return isVisible;
    },
    get isDragging() {
      return isDragging;
    },
    get dragOffset() {
      return dragOffset;
    },
    set dragOffset(value) {
      dragOffset = value;
    },
    show,
    hide,
    toggle,
    setDragging,
    savePosition,
    loadPosition,
  };
}

export const optionsPanelState = initOptionsPanelState();