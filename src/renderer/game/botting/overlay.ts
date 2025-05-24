import { TypedEmitter } from "tiny-typed-emitter";
import type { Command } from "./command";

type Events = {
  display(visible: boolean): void;
  hide(): void;
  show(): void;
};
type Position = {
  height?: string;
  left: string;
  top: string;
  visible: boolean;
  width?: string;
};

export class CommandOverlay extends TypedEmitter<Events> {
  private readonly overlay!: HTMLDivElement;

  private readonly listContainer!: HTMLDivElement;

  private readonly headerElement!: HTMLDivElement;

  private readonly headerTextElement!: HTMLSpanElement;

  private readonly headerControlsElement!: HTMLDivElement;

  private readonly toggleButton!: HTMLElement;

  private lastCommands: string[] = [];

  private lastIndex: number = -1;

  private updateThrottleId: number | null = null;

  private isDragging: boolean = false;

  private dragOffset: { x: number; y: number } = { x: 0, y: 0 };

  private listVisible: boolean = true;

  private storageKey: string = "command-overlay-position";

  private resizeObserver: ResizeObserver | null = null;

  public constructor() {
    super();

    this.overlay = document.createElement("div");
    this.overlay.id = "command-overlay";
    this.overlay.className = "command-overlay";

    this.headerElement = document.createElement("div");
    this.headerElement.className = "command-overlay-header";

    this.headerTextElement = document.createElement("span");
    this.headerTextElement.className = "command-overlay-header-text";
    this.headerTextElement.textContent = "Commands";

    this.headerControlsElement = document.createElement("div");
    this.headerControlsElement.className = "command-overlay-header-controls";

    const closeButton = document.createElement("div");
    closeButton.className = "command-overlay-control command-overlay-close";
    closeButton.innerHTML = "&#x2715;"; // X symbol
    closeButton.title = "Hide overlay";
    closeButton.addEventListener("click", (ev) => {
      ev.stopPropagation();
      this.hide();
    });

    this.toggleButton = document.createElement("div");
    this.toggleButton.className = "command-overlay-control";
    this.toggleButton.textContent = "▼";
    this.toggleButton.title = "Toggle overlay";
    this.toggleButton.addEventListener("click", (ev) => {
      ev.stopPropagation();
      this.toggleListVisibility();
      this.updateHeaderText();
      this.savePosition();
    });

    this.headerControlsElement.append(this.toggleButton, closeButton);
    this.headerElement.append(
      this.headerTextElement,
      this.headerControlsElement,
    );

    this.listContainer = document.createElement("div");
    this.listContainer.className = "command-list-container";

    this.overlay.append(this.headerElement, this.listContainer);
    document.body.append(this.overlay);

    this.loadPosition();
    this.setupDragging();
    this.setupContextMenu();
    this.setupHoverEffects();
    this.setupKeybinds();
    this.setupScrollBehavior();
    this.setupResizeObserver();
    this.updateHeaderText();
  }

  /**
   * Update commands displayed in the overlay
   */
  public updateCommands(commands: Command[], currentIndex: number): void {
    if (this.updateThrottleId !== null) {
      window.cancelAnimationFrame(this.updateThrottleId);
    }

    this.updateThrottleId = window.requestAnimationFrame(() => {
      this.updateThrottleId = null;
      this._updateCommands(commands, currentIndex);
    });
  }

  /**
   * Show the overlay.
   */
  public show(): void {
    this.overlay.style.display = "block";

    if (this.listVisible) {
      this.listContainer.style.display = "block";
      this.overlay.classList.remove("collapsed");
    } else {
      this.listContainer.style.display = "none";
      this.overlay.classList.add("collapsed");
    }

    this.emit("display", true);
    this.emit("show");
  }

  /**
   * Hide the overlay.
   */
  public hide(): void {
    this.overlay.style.display = "none";
    this.emit("display", false);
    this.emit("hide");
  }

  /**
   * Toggle the visibility of the overlay.
   */
  public toggle(): void {
    const currentDisplay = window.getComputedStyle(this.overlay).display;

    if (currentDisplay === "none") {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * Whether the overlay is currently visible.
   */
  public isVisible(): boolean {
    return window.getComputedStyle(this.overlay).display !== "none";
  }

  /**
   * Save the current position and size of the overlay to localStorage.
   */
  private savePosition(): void {
    const position: Position = {
      left: this.overlay.style.left,
      top: this.overlay.style.top,
      visible: this.listVisible,
    };

    // Save size only when expanded
    if (this.listVisible) {
      position.width = this.overlay.style.width;
      position.height = this.overlay.style.height;
    }

    localStorage.setItem(this.storageKey, JSON.stringify(position));
  }

  /**
   * Load the saved position and size of the overlay from localStorage.
   */
  private loadPosition(): void {
    const savedPosition = localStorage.getItem(this.storageKey);

    if (!savedPosition) {
      this.overlay.style.left = "20px";
      this.overlay.style.top = "20px";
      return;
    }

    const position = JSON.parse(savedPosition) as Position;

    if (position.left && position.top) {
      this.overlay.style.left = position.left;
      this.overlay.style.top = position.top;
    } else {
      this.overlay.style.left = "20px";
      this.overlay.style.top = "20px";
    }

    if (position.visible !== undefined) {
      this.listVisible = position.visible;

      if (!this.listVisible) {
        this.listContainer.style.display = "none";
        this.overlay.classList.add("collapsed");
      } else if (position.width && position.height) {
        this.overlay.style.width = position.width;
        this.overlay.style.height = position.height;
      }
    }
  }

  /**
   * Setup the resize observer to handle window resize events
   */
  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.ensureWithinViewport();
    });

    this.resizeObserver.observe(document.body);
  }

  /**
   * Ensure the overlay stays within the viewport
   */
  private ensureWithinViewport(): void {
    const rect = this.overlay.getBoundingClientRect();
    const { innerWidth, innerHeight } = window;

    // If overlay is outside viewport horizontally
    if (rect.right > innerWidth) {
      const newLeft = Math.max(0, innerWidth - rect.width);
      this.overlay.style.left = `${newLeft}px`;
    }

    // If overlay is outside viewport vertically
    if (rect.bottom > innerHeight) {
      const newTop = Math.max(0, innerHeight - rect.height);
      this.overlay.style.top = `${newTop}px`;
    }

    this.savePosition();
  }

  private setupDragging(): void {
    // Dragging on header
    this.headerElement.addEventListener("mousedown", (ev) => {
      // Left click not pressed?
      if (ev.button !== 0) return;
      if (
        (ev.target as HTMLElement).classList.contains("command-overlay-control")
      )
        return;

      this.isDragging = true;

      const rect = this.overlay.getBoundingClientRect();
      this.dragOffset = {
        x: ev.clientX - rect.left,
        y: ev.clientY - rect.top,
      };

      this.overlay.classList.add("dragging");
    });

    document.addEventListener("mousemove", (ev) => {
      if (!this.isDragging) return;

      // Calculate new position
      let x = ev.clientX - this.dragOffset.x;
      let y = ev.clientY - this.dragOffset.y;

      const { width, height } = this.overlay.getBoundingClientRect();
      const { innerWidth, innerHeight } = window;

      x = Math.max(0, Math.min(x, innerWidth - width));
      y = Math.max(0, Math.min(y, innerHeight - height));

      this.overlay.style.left = `${x}px`;
      this.overlay.style.top = `${y}px`;
    });

    // Stop dragging
    document.addEventListener("mouseup", () => {
      if (!this.isDragging) return;

      this.isDragging = false;
      this.overlay.classList.remove("dragging");
      this.savePosition();
    });
  }

  private setupContextMenu(): void {
    // Right click header
    this.headerElement.addEventListener("contextmenu", (ev) => {
      ev.preventDefault();

      this.toggleListVisibility();
      this.updateHeaderText();
      this.savePosition();
    });

    // Double click header
    this.headerElement.addEventListener("dblclick", (ev) => {
      if (
        (ev.target as HTMLElement).classList.contains("command-overlay-control")
      )
        return;

      this.toggleListVisibility();
      this.updateHeaderText();
      this.savePosition();
    });
  }

  private setupHoverEffects(): void {
    this.listContainer.addEventListener("mouseover", (ev) => {
      const target = ev.target as HTMLElement;
      // Hover in on command
      if (
        target.classList.contains("command-item") &&
        !target.classList.contains("active")
      ) {
        target.classList.add("hover");
      }
    });

    this.listContainer.addEventListener("mouseout", (ev) => {
      const target = ev.target as HTMLElement;
      // Hover out on command
      if (target.classList.contains("command-item")) {
        target.classList.remove("hover");
      }
    });
  }

  private setupKeybinds(): void {
    document.addEventListener("keydown", (ev) => {
      try {
        // If for some reason, the chat is focused, ignore key events
        if (swf.isChatFocused()) return;

        // Toggle overlay visibility
        if (ev.key === "`" || ev.key === "~") {
          ev.preventDefault();
          this.toggle();
        }
      } catch {}
    });
  }

  private setupScrollBehavior(): void {
    this.listContainer.addEventListener(
      "wheel",
      (ev) => {
        const container = this.listContainer;
        const { scrollTop, scrollHeight, clientHeight } = container;
        const delta = ev.deltaY;

        const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
        const atTop = scrollTop <= 0;

        if (!(delta > 0 && atBottom) && !(delta < 0 && atTop)) {
          ev.stopPropagation();
        }

        setTimeout(() => {
          const activeElement = this.listContainer.querySelector(
            ".command-item.active",
          ) as HTMLElement;
          if (activeElement) {
            const containerRect = this.listContainer.getBoundingClientRect();
            const elementRect = activeElement.getBoundingClientRect();

            const isVisible =
              elementRect.top >= containerRect.top &&
              elementRect.bottom <= containerRect.bottom;

            if (!isVisible && window.context.isRunning()) {
              activeElement.scrollIntoView({
                block: "nearest",
                behavior: "smooth",
              });
            }
          }
        }, 50);
      },
      { passive: false },
    );
  }

  /**
   * Toggles the visibility of the command list.
   */
  private toggleListVisibility(): void {
    this.listVisible = !this.listVisible;

    if (this.listVisible) {
      this.listContainer.style.display = "block";
      this.overlay.classList.remove("collapsed");
    } else {
      this.listContainer.style.display = "none";
      this.overlay.classList.add("collapsed");
    }
  }

  /**
   * Update the overlay header text.
   */
  private updateHeaderText(): void {
    const count = this.lastCommands.length;
    this.headerTextElement.textContent = `Commands (${count})`;

    this.toggleButton.textContent = this.listVisible ? "▼" : "▶";
  }

  /**
   * Updates the displayed commands as needed.
   *
   * @param commands - The list of commands to display.
   * @param currentIndex - The index of the currently active command.
   */
  private _updateCommands(commands: Command[], currentIndex: number): void {
    const commandStrings = commands.map(
      (cmd, index) => `[${index + 1}] ${cmd.toString()}`,
    );

    // Only update if there's a change
    if (
      this.lastIndex === currentIndex &&
      this.lastCommands.length === commandStrings.length &&
      this.lastCommands.every((cmd, index) => cmd === commandStrings[index])
    ) {
      return;
    }

    this.lastCommands = commandStrings;
    this.lastIndex = currentIndex;

    if (this.listContainer.children.length === commandStrings.length) {
      // Update existing elements only if the count is the same
      for (const [index, commandString] of commandStrings.entries()) {
        const element = this.listContainer.children[index] as HTMLElement;
        if (element.textContent !== commandString) {
          element.textContent = commandString;
        }

        if (index === currentIndex) {
          element.classList.add("active");
          if (window.context.isRunning()) {
            element.scrollIntoView({
              block: "nearest",
              behavior: "smooth",
            });
          }
        } else {
          element.classList.remove("active");
        }
      }
    } else {
      const fragment = document.createDocumentFragment();
      for (const [index, cmdString] of commandStrings.entries()) {
        const commandElement = document.createElement("div");
        commandElement.textContent = cmdString;
        commandElement.className = "command-item";
        if (index === currentIndex) {
          commandElement.classList.add("active");
        }

        fragment.append(commandElement);
      }

      this.listContainer.innerHTML = "";
      this.listContainer.append(fragment);

      if (
        currentIndex >= 0 &&
        this.listContainer.children[currentIndex] &&
        window.context.isRunning()
      ) {
        const activeElement = this.listContainer.children[
          currentIndex
        ] as HTMLElement;

        setTimeout(() => {
          activeElement.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
          });
        }, 10);
      }
    }

    this.updateHeaderText();
  }
}
