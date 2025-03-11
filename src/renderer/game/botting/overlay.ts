import { TypedEmitter } from 'tiny-typed-emitter';
import type { Command } from './command';

type Events = {
  display(visible: boolean): void;
  hide(): void;
  show(): void;
};

export class CommandOverlay extends TypedEmitter<Events> {
  private readonly overlay!: HTMLDivElement;

  private readonly listContainer!: HTMLDivElement;

  private readonly headerElement!: HTMLDivElement;

  private lastCommands: string[] = [];

  private lastIndex: number = -1;

  private updateThrottleId: number | null = null;

  private isDragging: boolean = false;

  private dragOffset: { x: number; y: number } = { x: 0, y: 0 };

  private listVisible: boolean = true;

  private storageKey: string = 'command-overlay-position';

  public constructor() {
    super();

    this.overlay = document.createElement('div');
    this.overlay.id = 'command-overlay';
    this.overlay.className = 'command-overlay';

    this.headerElement = document.createElement('div');
    this.headerElement.className = 'command-overlay-header';
    this.headerElement.textContent = 'Commands';

    this.listContainer = document.createElement('div');
    this.listContainer.className = 'command-list-container';

    this.overlay.appendChild(this.headerElement);
    this.overlay.appendChild(this.listContainer);
    document.body.appendChild(this.overlay);

    this.loadPosition();
    this.setupDragging();
    this.setupContextMenu();
    this.setupHoverEffects();
    this.setupKeybinds();
    this.setupScrollBehavior();
  }

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
    this.overlay.style.display = 'block';

    if (this.listVisible) {
      this.listContainer.style.display = 'block';
      this.overlay.classList.remove('collapsed');
    } else {
      this.listContainer.style.display = 'none';
      this.overlay.classList.add('collapsed');
    }

    this.emit('display', true);
    this.emit('show');
  }

  /**
   * Hide the overlay.
   */
  public hide(): void {
    this.overlay.style.display = 'none';
    this.emit('display', false);
    this.emit('hide');
  }

  /**
   * Toggle the visibility of the overlay.
   */
  public toggle(): void {
    const currentDisplay = window.getComputedStyle(this.overlay).display;

    if (currentDisplay === 'none') {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * Whether the overlay is currently visible.
   */
  public isVisible(): boolean {
    return window.getComputedStyle(this.overlay).display !== 'none';
  }

  /**
   * Save the current position of the overlay to localStorage.
   */
  private savePosition(): void {
    const position = {
      left: this.overlay.style.left,
      top: this.overlay.style.top,
      visible: this.listVisible,
    };

    localStorage.setItem(this.storageKey, JSON.stringify(position));
  }

  /**
   * Load the saved position of the overlay from localStorage.
   */
  private loadPosition(): void {
    const savedPosition = localStorage.getItem(this.storageKey);

    if (savedPosition) {
      const position = JSON.parse(savedPosition);

      if (position.left && position.top) {
        this.overlay.style.left = position.left;
        this.overlay.style.top = position.top;
      }

      if (position.visible !== undefined) {
        this.listVisible = position.visible;

        if (!this.listVisible) {
          this.listContainer.style.display = 'none';
          this.overlay.classList.add('collapsed');
        }
      }
    }
  }

  private setupDragging(): void {
    // Start dragging
    this.headerElement.addEventListener('mousedown', (ev) => {
      // Left click not pressed?
      if (ev.button !== 0) return;

      this.isDragging = true;

      const rect = this.overlay.getBoundingClientRect();
      this.dragOffset = {
        x: ev.clientX - rect.left,
        y: ev.clientY - rect.top,
      };

      this.overlay.classList.add('dragging');
    });

    // Dragging
    document.addEventListener('mousemove', (ev) => {
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
    document.addEventListener('mouseup', () => {
      if (!this.isDragging) return;

      this.isDragging = false;
      this.overlay.classList.remove('dragging');
      this.savePosition();
    });
  }

  private setupContextMenu(): void {
    // Right click header
    this.headerElement.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();

      this.toggleListVisibility();
      this.updateHeaderText();
      this.savePosition();
    });

    // Double click header
    this.headerElement.addEventListener('dblclick', () => {
      this.toggleListVisibility();
      this.updateHeaderText();
      this.savePosition();
    });
  }

  private setupHoverEffects(): void {
    this.listContainer.addEventListener('mouseover', (ev) => {
      const target = ev.target as HTMLElement;
      // Hover in on command
      if (
        target.classList.contains('command-item') &&
        !target.classList.contains('active')
      ) {
        target.classList.add('hover');
      }
    });

    this.listContainer.addEventListener('mouseout', (ev) => {
      const target = ev.target as HTMLElement;
      // Hover out on command
      if (target.classList.contains('command-item')) {
        target.classList.remove('hover');
      }
    });
  }

  private setupKeybinds(): void {
    document.addEventListener('keydown', (ev: KeyboardEvent) => {
      try {
        // if for some reason, they need to type in chat, block
        if (swf.isChatFocused()) return;

        // TODO: reassignable

        if (ev.key === '`' || ev.key === '~') {
          ev.preventDefault();
          this.toggle();
        }
      } catch {}
    });
  }

  private setupScrollBehavior(): void {
    this.listContainer.addEventListener(
      'wheel',
      (event) => {
        const container = this.listContainer;
        const { scrollTop, scrollHeight, clientHeight } = container;
        const delta = event.deltaY;

        const atBottom = scrollTop + clientHeight >= scrollHeight;
        const atTop = scrollTop <= 0;

        if (!(delta > 0 && atBottom) && !(delta < 0 && atTop)) {
          event.stopPropagation();
        }
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
      this.listContainer.style.display = 'block';
      this.overlay.classList.remove('collapsed');
    } else {
      this.listContainer.style.display = 'none';
      this.overlay.classList.add('collapsed');
    }
  }

  /**
   * Update the overlay header text.
   */
  private updateHeaderText(): void {
    const count = this.lastCommands.length;
    const statusIcon = this.listVisible ? '▼' : '▶';
    this.headerElement.textContent = `${statusIcon} Commands (${count})`;
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
          element.classList.add('active');
        } else {
          element.classList.remove('active');
        }
      }
    } else {
      const fragment = document.createDocumentFragment();
      for (const [index, cmdString] of commandStrings.entries()) {
        const commandElement = document.createElement('div');
        commandElement.textContent = cmdString;
        commandElement.className = 'command-item';
        if (index === currentIndex) {
          commandElement.classList.add('active');
        }

        fragment.appendChild(commandElement);
      }

      this.listContainer.innerHTML = '';
      this.listContainer.appendChild(fragment);
    }

    this.updateHeaderText();
  }
}
