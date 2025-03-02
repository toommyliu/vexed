import { IPC_EVENTS } from '../../../common/ipc-events';
import { ipcRenderer } from '../../../common/ipc';

const packets: string[] = [];
let on = false;

let selectedLine: HTMLElement | null = null;

function toggleElement(el: HTMLButtonElement, state: boolean) {
  el.disabled = state;

  if (state) {
    el.classList.add('w3-disabled');
    el.setAttribute('disabled', 'true');
  } else {
    el.classList.remove('w3-disabled');
    el.removeAttribute('disabled');
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  {
    const btn = document.querySelector('#clear') as HTMLButtonElement;
    btn.addEventListener('click', () => {
      document.querySelector('#spammer')!.innerHTML = '';
      packets.length = 0;
    });
  }

  {
    const spammer = document.querySelector('#spammer') as HTMLDivElement;
    const removeBtn = document.querySelector('#remove') as HTMLButtonElement;
    const addBtn = document.querySelector('#add') as HTMLButtonElement;

    addBtn.addEventListener('click', () => {
      const packet = (document.querySelector('#packet') as HTMLInputElement)
        .value;

      if (!packet.length) return;

      packets.push(packet);

      {
        const div = document.createElement('div');
        div.classList.add('line', 'rounded');
        div.innerHTML = packet;
        div.addEventListener('click', (ev) => {
          if (selectedLine) selectedLine.classList.remove('selected-line');

          if (ev.target === selectedLine) {
            selectedLine = null;
            toggleElement(removeBtn, true);
          } else {
            selectedLine = ev.target as HTMLElement;
            selectedLine.classList.add('selected-line');
            toggleElement(removeBtn, false);
          }
        });
        spammer.appendChild(div);
      }

      spammer.scrollTo(0, spammer.scrollHeight);
    });

    removeBtn.addEventListener('click', () => {
      if (!selectedLine) return;

      selectedLine.remove();
      selectedLine = null;

      toggleElement(removeBtn, true);

      const index = packets.indexOf(selectedLine!.innerHTML);
      packets.splice(index, 1);
    });
  }

  {
    const stopBtn = document.querySelector('#stop') as HTMLButtonElement;
    const onBtn = document.querySelector('#start') as HTMLButtonElement;

    stopBtn.addEventListener('click', async () => {
      on = false;

      toggleElement(stopBtn, true);
      toggleElement(onBtn, false);

      await ipcRenderer
        .callMain(IPC_EVENTS.MSGBROKER, {
          ipcEvent: IPC_EVENTS.PACKET_SPAMMER_STOP,
        })
        .catch(() => {});
    });

    onBtn.addEventListener('click', async () => {
      on = true;

      toggleElement(stopBtn, false);
      toggleElement(onBtn, true);

      await ipcRenderer
        .callMain(IPC_EVENTS.MSGBROKER, {
          ipcEvent: IPC_EVENTS.PACKET_SPAMMER_START,
          data: {
            packets,
            delay:
              Number.parseInt(
                (document.querySelector('#delay') as HTMLInputElement).value,
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

    on = false;

    const stopBtn = document.querySelector('#stop') as HTMLButtonElement;
    const onBtn = document.querySelector('#start') as HTMLButtonElement;

    toggleElement(stopBtn, true);
    toggleElement(onBtn, false);
  });
});
