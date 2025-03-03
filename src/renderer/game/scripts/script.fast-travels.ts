import { ipcRenderer } from '../../../common/ipc';
import { IPC_EVENTS } from '../../../common/ipc-events';
import { Logger } from '../../../common/logger';

const logger = Logger.get('FastTravels');

let roomNumber = 100_000;

function toggleButtons(on: boolean) {
  const buttons = document.querySelectorAll('button');
  for (const button of buttons) {
    button.disabled = !on;
    button.classList.toggle('w3-disabled', !on);
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  const locations = await ipcRenderer
    .callMain(IPC_EVENTS.READ_FAST_TRAVELS)
    .catch(() => {
      logger.error('Failed to read fast travels list');
      return [];
    });

  const input = document.querySelector('#room-number') as HTMLInputElement;
  input.addEventListener('input', () => {
    const val = Number.parseInt(input.value, 10);

    if (Number.isNaN(val)) {
      roomNumber = 100_000;
      return;
    }

    // clamp between 1 and 100_000
    roomNumber = Math.max(1, Math.min(val, 100_000));
    input.value = roomNumber.toString();
  });

  const container = document.querySelector('#locations') as HTMLDivElement;

  for (const location of locations) {
    if (!location.map) continue;

    const div = document.createElement('div');

    const button = document.createElement('button');
    button.classList.add('w3-button', 'w3-round-medium', 'w3-block');
    button.textContent = location.name;

    // eslint-disable-next-line @typescript-eslint/no-loop-func
    button.addEventListener('click', async () => {
      logger.info(location);

      toggleButtons(false);
      await ipcRenderer.callMain(IPC_EVENTS.MSGBROKER, {
        data: { ...location, roomNumber },
        ipcEvent: IPC_EVENTS.FAST_TRAVEL,
      });
      toggleButtons(true);
    });

    div.appendChild(button);
    container.appendChild(div);
  }
});
