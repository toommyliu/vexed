import { WINDOW_IDS } from '../../common/constants';
import { ipcRenderer } from '../../common/ipc';
import { IPC_EVENTS } from '../../common/ipc-events';
import { Bot } from './lib/Bot';

const bot = Bot.getInstance();

const dropdowns = new Map<string, HTMLElement>();

const checkmarkSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
</svg>`;

ipcRenderer.answerMain(IPC_EVENTS.SCRIPT_LOADED, () => {
  const btn = document.querySelector(
    '#scripts-dropdowncontent > button:nth-child(2)',
  ) as HTMLButtonElement;

  btn.disabled = false;
  btn.classList.remove('w3-disabled');
  btn.textContent = 'Start';
});

window.addEventListener('DOMContentLoaded', async () => {
  dropdowns.set('scripts', document.querySelector('#scripts-dropdowncontent')!);
  dropdowns.set('tools', document.querySelector('#tools-dropdowncontent')!);
  dropdowns.set('packets', document.querySelector('#packets-dropdowncontent')!);
  dropdowns.set('options', document.querySelector('#options-dropdowncontent')!);

  {
    const btn = document.querySelector(
      '#scripts-dropdowncontent > button:nth-child(1)',
    ) as HTMLButtonElement;

    btn.onclick = async () => {
      await ipcRenderer.callMain(IPC_EVENTS.LOAD_SCRIPT).catch(() => {});
    };
  }

  {
    const btn = document.querySelector(
      '#scripts-dropdowncontent > button:nth-child(2)',
    ) as HTMLButtonElement;

    const onEnd = () => {
      btn.textContent = 'Start';
      window.context.removeListener('end', onEnd);
    };

    btn.onclick = () => {
      if (window.context.isRunning()) {
        void window.context.stop();
        btn.textContent = 'Start';
      } else {
        if (!window.context.commands.length) return;

        window.context.on('end', onEnd);

        void window.context.start();
        btn.textContent = 'Stop';
      }
    };
  }

  {
    const btn = document.querySelector(
      '#scripts-dropdowncontent > button:nth-child(3)',
    ) as HTMLButtonElement;
    btn.addEventListener('click', async () => {
      await ipcRenderer.callMain(IPC_EVENTS.TOGGLE_DEV_TOOLS).catch(() => {});
    });
  }

  {
    const btn = document.querySelector(
      '#tools-dropdowncontent > button:nth-child(1)',
    ) as HTMLButtonElement;
    btn.addEventListener('click', async () => {
      await ipcRenderer
        .callMain(IPC_EVENTS.ACTIVATE_WINDOW, {
          windowId: WINDOW_IDS.FAST_TRAVELS,
        })
        .catch(() => {});
    });
  }

  {
    const btn = document.querySelector(
      '#tools-dropdowncontent > button:nth-child(2)',
    ) as HTMLButtonElement;
    btn.addEventListener('click', async () => {
      await ipcRenderer
        .callMain(IPC_EVENTS.ACTIVATE_WINDOW, {
          windowId: WINDOW_IDS.LOADER_GRABBER,
        })
        .catch(() => {});
    });
  }

  {
    const btn = document.querySelector(
      '#tools-dropdowncontent > button:nth-child(3)',
    ) as HTMLButtonElement;
    btn.addEventListener('click', async () => {
      await ipcRenderer.callMain(IPC_EVENTS.ACTIVATE_WINDOW, {
        windowId: WINDOW_IDS.FOLLOWER,
      });
    });
  }

  {
    const btn = document.querySelector(
      '#packets-dropdowncontent > button:nth-child(1)',
    ) as HTMLButtonElement;
    btn.addEventListener('click', async () => {
      await ipcRenderer
        .callMain(IPC_EVENTS.ACTIVATE_WINDOW, {
          windowId: WINDOW_IDS.PACKETS_LOGGER,
        })
        .catch(() => {});
    });
  }

  {
    const btn = document.querySelector(
      '#packets-dropdowncontent > button:nth-child(2)',
    ) as HTMLButtonElement;
    btn.addEventListener('click', async () => {
      await ipcRenderer
        .callMain(IPC_EVENTS.ACTIVATE_WINDOW, {
          windowId: WINDOW_IDS.PACKETS_SPAMMER,
        })
        .catch(() => {});
    });
  }

  {
    let lastRoomId: number | null;

    const el_cells = document.querySelector('#cells') as HTMLSelectElement;
    const el_pads = document.querySelector('#pads') as HTMLSelectElement;
    const el_x = document.querySelector('#x') as HTMLButtonElement;

    const updateSelectMenus = (forceUpdate: boolean = false) => {
      if (!bot.player.isReady()) return;

      if (!forceUpdate && lastRoomId === bot.world.roomId) {
        return;
      }

      el_cells.innerHTML = '';

      for (const cell of bot.world.cells) {
        const option = document.createElement('option');
        option.value = cell;
        option.text = cell;
        el_cells.appendChild(option);
      }

      el_cells.value = bot.player.cell ?? 'Enter';
      el_pads.value = bot.player.pad ?? 'Spawn';

      lastRoomId = bot.world.roomId;
    };

    const jumpToCell = () => {
      const _cell = el_cells.value ?? 'Enter';
      const _pad = el_pads.value ?? 'Spawn';

      bot.flash.call(() => swf.playerJump(_cell, _pad));
    };

    el_cells.addEventListener('mousedown', (ev) => {
      // Prevent the select from closing
      ev.stopPropagation();
      updateSelectMenus();
    });
    el_cells.addEventListener('change', jumpToCell);

    el_pads.addEventListener('mousedown', (ev) => {
      // Prevent the select from closing
      ev.stopPropagation();
      updateSelectMenus();
    });
    el_pads.addEventListener('change', jumpToCell);

    el_x.addEventListener('click', () => updateSelectMenus(true));
  }

  {
    const btn = document.querySelector('#bank') as HTMLButtonElement;
    btn.addEventListener('click', async () => {
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
      if (option.id === 'option-walkspeed') {
        const _option = option.querySelector('input') as HTMLInputElement;

        const handleWalkSpeed = (event: Event) => {
          const value = Number.parseInt(_option.value, 10);

          const newWalkSpeed = Number.isNaN(value)
            ? 8 // default 8
            : Math.max(0, Math.min(99, value)); // clamp between 0 and 99

          _option.value = newWalkSpeed.toString();

          if (event.type === 'change') bot.settings.walkSpeed = newWalkSpeed;
        };

        _option.addEventListener('input', handleWalkSpeed);
        _option.addEventListener('change', handleWalkSpeed);
      } else {
        const checkmark = document.createElement('div');
        checkmark.className = 'option-checkmark';
        checkmark.innerHTML = checkmarkSvg;
        option.appendChild(checkmark);

        option.setAttribute('data-state', 'false');

        option.addEventListener('click', (ev) => {
          // Prevent the dropdown from closing
          ev.stopPropagation();

          const currentState = option.getAttribute('data-state') === 'true';
          const newState = !currentState;

          option.setAttribute('data-state', newState.toString());
          option.classList.toggle('option-active', newState);

          switch (option.id) {
            case 'option-infinite-range':
              bot.settings.infiniteRange = newState;
              break;
            case 'option-provoke-map':
              bot.settings.provokeMap = newState;
              break;
            case 'option-provoke-cell':
              bot.settings.provokeCell = newState;
              break;
            case 'option-enemy-magnet':
              bot.settings.enemyMagnet = newState;
              break;
            case 'option-lag-killer':
              bot.settings.lagKiller = newState;
              break;
            case 'option-hide-players':
              bot.settings.hidePlayers = newState;
              break;
            case 'option-skip-cutscenes':
              bot.settings.skipCutscenes = newState;
              break;
            case 'option-disable-fx':
              bot.settings.disableFx = newState;
              break;
            case 'option-disable-collisions':
              bot.settings.disableCollisions = newState;
              break;
          }
        });
      }
    }
  }
});

window.addEventListener('click', (ev) => {
  const target = ev.target as HTMLElement;
  const optionsDropdown = document.querySelector('#options-dropdowncontent');

  for (const [key, el] of dropdowns.entries()) {
    if (target.id === key) {
      // Show the clicked dropdown
      el.classList.toggle('w3-show');
    } else if (
      target.id !== 'option-walkspeed' &&
      !(optionsDropdown?.contains(target) && target.closest('[id^="option-"]'))
    ) {
      // Hide other dropdowns, except when clicking an option
      el.classList.remove('w3-show');
    }
  }
});

window.addEventListener('mousedown', (ev) => {
  // Close all dropdowns when focusing the game
  if ((ev.target as HTMLElement).id === 'swf') {
    for (const el of dropdowns.values()) {
      el.classList.remove('w3-show');
    }
  }
});

window.addEventListener('keydown', (ev) => {
  // Allow certain shortcuts while the game is focused
  if (
    (ev.ctrlKey /* ctrl */ || ev.metaKey) /* cmd */ &&
    (ev.target as HTMLElement).id === 'swf'
  ) {
    switch (ev.key.toLowerCase()) {
      case 'w':
      case 'q':
        window.close();
        break;
      case 'r':
        if (ev.shiftKey) {
          window.location.reload();
        }

        break;
    }
  }
});
